// TNT Quick Controls - Windows overlay helper.
//
// Windows counterpart to native-helper/ (macOS Swift). Same job, same contract:
//   - grab global hotkeys while After Effects has focus  (RegisterHotKey)
//   - show a borderless always-on-top overlay hosting quick.html  (WebView2)
//   - forward the page's ExtendScript requests to the CEP panel over loopback TCP
//
// It never talks to After Effects directly. All AE work goes through the panel's
// bridge server (src/js/25-native-bridge-server.js), which runs the script via
// CSInterface.evalScript. That is why this file needs no AppleScript equivalent.

using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace TntQuickControls;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new OverlayForm());
    }
}

/// <summary>Loopback client for the CEP panel's ExtendScript bridge.</summary>
internal static class PanelBridge
{
    private const string Host = "127.0.0.1";
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(15);

    private const string Unreachable =
        "Could not reach the panel bridge. " +
        "Open the Premiere Style Timeline panel in After Effects.";

    private static string ErrorJson(string message) =>
        JsonSerializer.Serialize(new { ok = false, error = message });

    private static string DiscoveryPath() => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
        ".tnt-quick-controls",
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

internal sealed class OverlayForm : Form
{
    private const int WmHotkey = 0x0312;
    private const uint ModControl = 0x0002;
    private const uint ModNoRepeat = 0x4000;
    private const int SummonHotkeyId = 1;

    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern bool UnregisterHotKey(IntPtr hWnd, int id);

    // Mirrors quickPanelControlName(forHotKeyId:) in the macOS helper.
    private static readonly Dictionary<int, (uint Key, string Control)> Hotkeys = new()
    {
        [10] = ((uint)Keys.A, "anchor"),
        [11] = ((uint)Keys.C, "composition"),
        [12] = ((uint)Keys.E, "ease"),
        [13] = ((uint)Keys.F, "mask"),
        [14] = ((uint)Keys.S, "styles"),
        [15] = ((uint)Keys.M, "mass-edit"),
        [16] = ((uint)Keys.T, "text-animation"),
        [17] = ((uint)Keys.O, "timing-order"),
        [18] = ((uint)Keys.X, "filter"),
    };

    private readonly WebView2 _webView = new();
    private bool _ready;
    private bool _allowVisible;

    public OverlayForm()
    {
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar = false;
        TopMost = true;
        StartPosition = FormStartPosition.CenterScreen;
        Size = new Size(620, 310);
        Visible = false;

        _webView.Dock = DockStyle.Fill;
        Controls.Add(_webView);
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

        RegisterHotKey(Handle, SummonHotkeyId, ModControl | ModNoRepeat, (uint)Keys.Space);
        foreach (var (id, entry) in Hotkeys)
            RegisterHotKey(Handle, id, ModControl | ModNoRepeat, entry.Key);
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
                var width = (int)w.GetDouble();
                var height = (int)h.GetDouble();
                if (width > 0 && height > 0) Size = new Size(width, height);
            }
        }
    }

    private async Task EvaluateAsync(string javaScript)
    {
        if (!_ready) return;
        try { await _webView.CoreWebView2.ExecuteScriptAsync(javaScript); }
        catch (InvalidOperationException) { /* webview torn down */ }
    }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == WmHotkey)
        {
            var id = m.WParam.ToInt32();
            if (id == SummonHotkeyId) ShowOverlay(null);
            else if (Hotkeys.TryGetValue(id, out var entry)) ShowOverlay(entry.Control);
        }
        base.WndProc(ref m);
    }

    // Application.Run() would otherwise show the overlay at launch. Stay hidden and
    // force handle creation so RegisterHotKey has a window to post WM_HOTKEY to.
    protected override void SetVisibleCore(bool value)
    {
        if (!_allowVisible)
        {
            value = false;
            if (!IsHandleCreated) CreateHandle();
        }
        base.SetVisibleCore(value);
    }

    private void ShowOverlay(string? control)
    {
        if (!Visible)
        {
            _allowVisible = true;
            Show();
            Activate();
        }
        BringToFront();

        if (control is null) return;
        _ = EvaluateAsync(
            "window.focus(); if (window.__tntQuickPanelOpenControl) " +
            $"window.__tntQuickPanelOpenControl({JsonSerializer.Serialize(control)});");
    }

    protected override void OnFormClosed(FormClosedEventArgs e)
    {
        UnregisterHotKey(Handle, SummonHotkeyId);
        foreach (var id in Hotkeys.Keys) UnregisterHotKey(Handle, id);
        base.OnFormClosed(e);
    }

    protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
    {
        if (keyData == Keys.Escape) { Hide(); return true; }
        return base.ProcessCmdKey(ref msg, keyData);
    }
}
