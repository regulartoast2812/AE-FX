// AE PR Quick Controls - Windows overlay helper.
//
// Windows counterpart to native-helper/ (macOS Swift). Same job, same contract:
//   - grab global hotkeys while After Effects has focus  (RegisterHotKey)
//   - show a borderless, per-pixel-transparent always-on-top overlay hosting
//     quick.html  (WPF + WebView2)
//   - forward the page's ExtendScript requests to the CEP panel over loopback TCP
//
// It never talks to After Effects directly. All AE work goes through the panel's
// bridge server (src/js/25-native-bridge-server.js), which runs the script via
// CSInterface.evalScript. That is why this file needs no AppleScript equivalent.
//
// WPF rather than WinForms specifically for AllowsTransparency. WinForms only
// offers TransparencyKey, a binary colour key with no alpha blending, which would
// render the shell's 18px rounded corners jagged and drop its shadow entirely.

using System.Runtime.InteropServices;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;

namespace AEPRQuickControls;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        var app = new Application { ShutdownMode = ShutdownMode.OnExplicitShutdown };
        var overlay = new OverlayWindow();
        overlay.Initialize();
        app.Run();
    }
}

/// <summary>Loopback client for the CEP panel's ExtendScript bridge.</summary>
internal static class PanelBridge
{
    private const string Host = "127.0.0.1";
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(15);

    private const string Unreachable =
        "Could not reach the panel bridge. " +
        "Open the AE PR panel in After Effects.";

    private static string ErrorJson(string message) =>
        JsonSerializer.Serialize(new { ok = false, error = message });

    private static string DiscoveryPath() => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
        ".ae-pr-quick-controls",
        "bridge.json");

    /// <summary>
    /// Port and token are published by the panel; nothing here is hardcoded.
    /// Returns null when the panel has never run or is currently closed.
    /// </summary>
    private static (int Port, string Token)? LoadEndpoint()
    {
        try
        {
            using var document = JsonDocument.Parse(File.ReadAllText(DiscoveryPath()));
            var root = document.RootElement;
            var port = root.GetProperty("port").GetInt32();
            var token = root.GetProperty("token").GetString();
            if (port <= 0 || port > 65535 || string.IsNullOrEmpty(token)) return null;
            return (port, token);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public static async Task<string> SendAsync(string id, string script)
    {
        var endpoint = LoadEndpoint();
        if (endpoint is null) return ErrorJson(Unreachable);
        var (port, token) = endpoint.Value;

        try
        {
            using var client = new TcpClient();
            using var cts = new CancellationTokenSource(Timeout);

            try
            {
                await client.ConnectAsync(Host, port, cts.Token);
            }
            catch (OperationCanceledException)
            {
                return ErrorJson("Panel bridge timed out while connecting.");
            }
            catch (SocketException)
            {
                // Nothing listening - the panel is closed in After Effects.
                return ErrorJson(Unreachable);
            }

            using var stream = client.GetStream();
            var request = JsonSerializer.Serialize(new { id, token, script }) + "\n";
            var payload = Encoding.UTF8.GetBytes(request);
            await stream.WriteAsync(payload, cts.Token);
            await stream.FlushAsync(cts.Token);

            var buffer = new byte[64 * 1024];
            var accumulated = new StringBuilder();
            while (true)
            {
                int read;
                try
                {
                    read = await stream.ReadAsync(buffer, cts.Token);
                }
                catch (OperationCanceledException)
                {
                    return ErrorJson("Panel bridge timed out.");
                }

                if (read <= 0) return ErrorJson("Panel bridge closed the connection.");

                accumulated.Append(Encoding.UTF8.GetString(buffer, 0, read));
                var text = accumulated.ToString();
                var newline = text.IndexOf('\n');
                if (newline < 0) continue;

                using var document = JsonDocument.Parse(text[..newline]);
                var root = document.RootElement;
                if (root.TryGetProperty("result", out var result))
                    return result.GetString() ?? string.Empty;
                if (root.TryGetProperty("error", out var error))
                    return ErrorJson(error.GetString() ?? "Bridge error.");
                return ErrorJson("Malformed bridge response.");
            }
        }
        catch (Exception ex)
        {
            return ErrorJson(ex.Message);
        }
    }
}

internal sealed class OverlayWindow : Window
{
    private const int WmHotkey = 0x0312;
    private const uint ModControl = 0x0002;
    private const uint ModNoRepeat = 0x4000;
    private const int SummonHotkeyId = 1;

    [DllImport("user32.dll")]
    private static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

    [DllImport("user32.dll")]
    private static extern bool UnregisterHotKey(IntPtr hWnd, int id);

    // Mirrors quickPanelControlName(forHotKeyId:) in the macOS helper.
    // Virtual-key codes are ASCII for A-Z, so 'A' == 0x41.
    private static readonly Dictionary<int, (uint Key, string Control)> Hotkeys = new()
    {
        [10] = ('A', "anchor"),
        [11] = ('C', "composition"),
        [12] = ('E', "ease"),
        [13] = ('F', "mask"),
        [14] = ('S', "styles"),
        [15] = ('M', "mass-edit"),
        [16] = ('T', "text-animation"),
        [17] = ('O', "timing-order"),
        [18] = ('X', "filter"),
    };

    private readonly WebView2 _webView = new();
    private IntPtr _handle = IntPtr.Zero;
    private bool _ready;

    public OverlayWindow()
    {
        // AllowsTransparency requires WindowStyle.None; together they give the
        // per-pixel alpha the page's rounded, translucent shell needs.
        WindowStyle = WindowStyle.None;
        AllowsTransparency = true;
        Background = Brushes.Transparent;
        ResizeMode = ResizeMode.NoResize;
        ShowInTaskbar = false;
        Topmost = true;
        WindowStartupLocation = WindowStartupLocation.CenterScreen;
        Width = 620;
        Height = 310;

        // Without this the WebView2 paints an opaque white sheet over the window's
        // transparency, regardless of the page's own transparent background.
        _webView.DefaultBackgroundColor = System.Drawing.Color.Transparent;
        Content = _webView;

        KeyDown += (_, e) => { if (e.Key == Key.Escape) Hide(); };
    }

    /// <summary>
    /// Creates the HWND without showing the window, hooks the message loop, claims
    /// the hotkeys, and starts loading the page.
    /// </summary>
    public void Initialize()
    {
        var helper = new WindowInteropHelper(this);
        _handle = helper.EnsureHandle();
        HwndSource.FromHwnd(_handle)?.AddHook(WndProcHook);

        RegisterHotKey(_handle, SummonHotkeyId, ModControl | ModNoRepeat, ' ');
        foreach (var (id, entry) in Hotkeys)
            RegisterHotKey(_handle, id, ModControl | ModNoRepeat, entry.Key);

        _ = InitializeWebViewAsync();
    }

    private static string ExtensionRoot()
    {
        var overridePath = Environment.GetEnvironmentVariable("TNT_EXTENSION_ROOT");
        if (!string.IsNullOrWhiteSpace(overridePath)) return overridePath;

        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null)
        {
            if (File.Exists(Path.Combine(directory.FullName, "quick.html"))) return directory.FullName;
            directory = directory.Parent;
        }
        throw new FileNotFoundException(
            "Could not locate quick.html. Set TNT_EXTENSION_ROOT to the extension folder.");
    }

    private async Task InitializeWebViewAsync()
    {
        await _webView.EnsureCoreWebView2Async();
        var core = _webView.CoreWebView2;
        var root = ExtensionRoot();

        // Same bootstrap the macOS helper injects at document start.
        var bootstrap =
            $"window.__TNT_EXTENSION_PATH__ = {JsonSerializer.Serialize(root)};" +
            "window.__TNT_NATIVE_HELPER__ = true;";
        await core.AddScriptToExecuteOnDocumentCreatedAsync(bootstrap);

        core.WebMessageReceived += OnWebMessage;
        core.Navigate(new Uri(Path.Combine(root, "quick.html")).AbsoluteUri);
        _ready = true;
    }

    private async void OnWebMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        JsonElement message;
        try
        {
            message = JsonDocument.Parse(e.WebMessageAsJson).RootElement;
        }
        catch (JsonException)
        {
            return;
        }

        // WebView2 has one message channel, so CSInterface.js tags each message.
        var channel = message.TryGetProperty("channel", out var c) ? c.GetString() : null;

        if (channel == "tntAE")
        {
            var id = message.GetProperty("id").GetString() ?? "";
            var script = message.GetProperty("script").GetString() ?? "";
            var result = await PanelBridge.SendAsync(id, script);
            await EvaluateAsync(
                $"window.__tntNativeResolve({JsonSerializer.Serialize(id)}, {JsonSerializer.Serialize(result)});");
            return;
        }

        if (channel == "tntWindow")
        {
            var action = message.TryGetProperty("action", out var a) ? a.GetString() : null;
            if (action == "close") { Hide(); return; }
            if (action == "resize"
                && message.TryGetProperty("width", out var w)
                && message.TryGetProperty("height", out var h))
            {
                // WPF sizes in DIPs; the page reports CSS pixels. Equal at 96 DPI,
                // and WebView2 already scales its contents per-monitor above that.
                var width = w.GetDouble();
                var height = h.GetDouble();
                if (width > 0 && height > 0) { Width = width; Height = height; }
            }
        }
    }

    private async Task EvaluateAsync(string javaScript)
    {
        if (!_ready) return;
        try { await _webView.CoreWebView2.ExecuteScriptAsync(javaScript); }
        catch (InvalidOperationException) { /* webview torn down */ }
    }

    private IntPtr WndProcHook(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        if (msg != WmHotkey) return IntPtr.Zero;

        var id = wParam.ToInt32();
        if (id == SummonHotkeyId) ShowOverlay(null);
        else if (Hotkeys.TryGetValue(id, out var entry)) ShowOverlay(entry.Control);
        handled = true;
        return IntPtr.Zero;
    }

    private void ShowOverlay(string? control)
    {
        if (!IsVisible)
        {
            Show();
            Activate();
        }
        Topmost = true;

        if (control is null) return;
        _ = EvaluateAsync(
            "window.focus(); if (window.__tntQuickPanelOpenControl) " +
            $"window.__tntQuickPanelOpenControl({JsonSerializer.Serialize(control)});");
    }

    protected override void OnClosed(EventArgs e)
    {
        if (_handle != IntPtr.Zero)
        {
            UnregisterHotKey(_handle, SummonHotkeyId);
            foreach (var id in Hotkeys.Keys) UnregisterHotKey(_handle, id);
        }
        base.OnClosed(e);
    }
}
