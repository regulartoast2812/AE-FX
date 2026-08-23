// AE FX Quick Controls - Windows overlay helper.
//
// Windows counterpart to native-helper/ (macOS Swift). Same job, same contract:
//   - grab the quick-controls hotkeys, but only while After Effects (or this
//     overlay) is the foreground app  (WH_KEYBOARD_LL, not RegisterHotKey)
//   - show a borderless, per-pixel-transparent always-on-top overlay hosting
//     quick.html over the After Effects window  (WPF + WebView2)
//   - forward the page's ExtendScript requests to the CEP panel over loopback TCP
//
// It never talks to After Effects directly. All AE work goes through the panel's
// bridge server (src/js/25-native-bridge-server.js), which runs the script via
// CSInterface.evalScript. That is why this file needs no AppleScript equivalent.
//
// WPF rather than WinForms specifically for AllowsTransparency. WinForms only
// offers TransparencyKey, a binary colour key with no alpha blending, which would
// render the shell's 18px rounded corners jagged and drop its shadow entirely.

using System.Diagnostics;
// WPF projects drop System.IO from the SDK's implicit usings, because
// System.Windows.Shapes.Path would collide with System.IO.Path. This file needs
// System.IO far more than it needs that namespace, so System.Windows.Shapes stays
// unimported and its one type used here (Rectangle) is written out in full.
using System.IO;
using System.Runtime.InteropServices;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Threading;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;

namespace AEFXQuickControls;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        // Single-instance guard. The macOS helper terminates duplicates
        // (terminateDuplicateQuickControlsInstances); a named mutex is the cheaper
        // equivalent here, and two instances fighting over one keyboard hook is
        // worse than the second one simply refusing to start.
        using var singleInstance = new Mutex(true, @"Local\AEFXQuickControls", out var isOwner);
        if (!isOwner) return;

        var app = new Application { ShutdownMode = ShutdownMode.OnExplicitShutdown };
        var overlay = new OverlayWindow();
        overlay.Initialize();
        app.Run();
    }
}

/// <summary>
/// Opt-in diagnostics. The helper has no window and no console, so when a hotkey
/// does nothing there is otherwise no way to tell whether the hook missed the key,
/// the AE window lookup failed, or the WebView never loaded. Set TNT_HELPER_LOG=1
/// to get a line per decision in %USERPROFILE%\.ae-fx-quick-controls\helper.log.
/// </summary>
internal static class Log
{
    private static readonly bool Enabled =
        Environment.GetEnvironmentVariable("TNT_HELPER_LOG") == "1";

    private static readonly string Path_ = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
        ".ae-fx-quick-controls",
        "helper.log");

    private static readonly object Gate = new();

    public static void Write(string message)
    {
        if (!Enabled) return;
        try
        {
            lock (Gate)
            {
                Directory.CreateDirectory(Path.GetDirectoryName(Path_)!);
                File.AppendAllText(Path_, $"{DateTime.Now:HH:mm:ss.fff}  {message}{Environment.NewLine}");
            }
        }
        catch (Exception) { /* diagnostics must never break the helper */ }
    }
}

/// <summary>Loopback client for the CEP panel's ExtendScript bridge.</summary>
internal static class PanelBridge
{
    private const string Host = "127.0.0.1";
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(15);

    private const string Unreachable =
        "Could not reach the panel bridge. " +
        "Open the AE FX panel in After Effects.";

    private static string ErrorJson(string message) =>
        JsonSerializer.Serialize(new { ok = false, error = message });

    private static string DiscoveryPath() => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
        ".ae-fx-quick-controls",
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

/// <summary>
/// Win32 window plumbing: finding the After Effects window, deciding whether AE is
/// frontmost, and placing the overlay over it. Everything here works in physical
/// pixels; WPF's own Left/Top/Width/Height are DIPs, so the two are kept apart
/// deliberately and converted only where the caller applies them.
/// </summary>
internal static class Native
{
    public const int WhKeyboardLl = 13;
    public const int WmKeyDown = 0x0100;
    public const int WmSysKeyDown = 0x0104;
    public const int VkControl = 0x11;
    public const int VkShift = 0x10;
    public const int VkMenu = 0x12;
    public const int VkLWin = 0x5B;
    public const int VkRWin = 0x5C;

    [StructLayout(LayoutKind.Sequential)]
    public struct Rect { public int Left, Top, Right, Bottom; }

    [StructLayout(LayoutKind.Sequential)]
    private struct MonitorInfo
    {
        public int cbSize;
        public Rect Monitor;
        public Rect Work;
        public uint Flags;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct KbdLlHookStruct
    {
        public uint vkCode;
        public uint scanCode;
        public uint flags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    public delegate IntPtr HookProc(int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SetWindowsHookEx(int idHook, HookProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll")]
    public static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
    public static extern IntPtr GetModuleHandle(string? lpModuleName);

    [DllImport("user32.dll")]
    public static extern short GetAsyncKeyState(int vKey);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("kernel32.dll")]
    private static extern uint GetCurrentThreadId();

    [DllImport("user32.dll")]
    private static extern bool AttachThreadInput(uint attachTo, uint attachFrom, bool attach);

    [DllImport("user32.dll")]
    private static extern bool GetWindowRect(IntPtr hWnd, out Rect rect);

    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern IntPtr MonitorFromWindow(IntPtr hWnd, uint flags);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern bool GetMonitorInfoW(IntPtr monitor, ref MonitorInfo info);

    [DllImport("user32.dll")]
    private static extern uint GetDpiForWindow(IntPtr hWnd);

    /// <summary>The After Effects main window, or IntPtr.Zero when AE is not running.</summary>
    public static IntPtr AfterEffectsWindow()
    {
        foreach (var process in Process.GetProcessesByName("AfterFX"))
        {
            using (process)
            {
                var handle = process.MainWindowHandle;
                if (handle != IntPtr.Zero && IsWindowVisible(handle)) return handle;
            }
        }
        return IntPtr.Zero;
    }

    /// <summary>
    /// Mirrors the macOS frontmost-bundle-identifier guard: hotkeys only fire, and
    /// the overlay only stays up, while AE or the overlay itself owns the
    /// foreground. Any window belonging to the AE process counts, since AE's
    /// floating panels are separate top-level windows.
    /// </summary>
    public static bool IsAfterEffectsOrOverlayFrontmost(IntPtr overlayHandle)
    {
        var foreground = GetForegroundWindow();
        if (foreground == IntPtr.Zero) return false;
        if (overlayHandle != IntPtr.Zero && foreground == overlayHandle) return true;

        GetWindowThreadProcessId(foreground, out var processId);
        if (processId == 0) return false;
        try
        {
            using var process = Process.GetProcessById((int)processId);
            return string.Equals(process.ProcessName, "AfterFX", StringComparison.OrdinalIgnoreCase);
        }
        catch (ArgumentException)
        {
            return false;
        }
    }

    public static double DpiScale(IntPtr hWnd)
    {
        var dpi = hWnd == IntPtr.Zero ? 96u : GetDpiForWindow(hWnd);
        return dpi == 0 ? 1.0 : dpi / 96.0;
    }

    /// <summary>
    /// Places the overlay over the After Effects window, matching
    /// afterEffectsOverlayFrame(for:) on macOS: centred horizontally, sitting over
    /// the timeline at 21% of the window height up from its bottom edge, then
    /// clamped into that monitor's work area with a 12px margin. Returns false when
    /// AE has no usable window, which is the caller's cue to stay hidden.
    /// </summary>
    public static bool TryGetOverlayOrigin(int width, int height, out int x, out int y)
    {
        x = 0;
        y = 0;
        var ae = AfterEffectsWindow();
        if (ae == IntPtr.Zero || !GetWindowRect(ae, out var aeRect)) return false;
        if (aeRect.Right - aeRect.Left < 420 || aeRect.Bottom - aeRect.Top < 300) return false;

        var aeHeight = aeRect.Bottom - aeRect.Top;
        var centreX = (aeRect.Left + aeRect.Right) / 2;
        // Screen Y grows downward here, so macOS's "21% up from the bottom" is a
        // subtraction from the bottom edge rather than an addition to the top.
        var centreY = aeRect.Bottom - (int)(aeHeight * 0.21);

        x = centreX - width / 2;
        y = centreY - height / 2;

        var monitor = MonitorFromWindow(ae, 0x00000002 /* MONITOR_DEFAULTTONEAREST */);
        var info = new MonitorInfo { cbSize = Marshal.SizeOf<MonitorInfo>() };
        if (monitor != IntPtr.Zero && GetMonitorInfoW(monitor, ref info))
        {
            var work = info.Work;
            x = Math.Min(Math.Max(x, work.Left + 12), Math.Max(work.Left + 12, work.Right - width - 12));
            y = Math.Min(Math.Max(y, work.Top + 12), Math.Max(work.Top + 12, work.Bottom - height - 12));
        }

        return true;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct AccentPolicy
    {
        public int AccentState;
        public int AccentFlags;
        public uint GradientColor;
        public int AnimationId;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct WindowCompositionAttributeData
    {
        public int Attribute;
        public IntPtr Data;
        public int SizeOfData;
    }

    [DllImport("user32.dll")]
    private static extern int SetWindowCompositionAttribute(
        IntPtr hWnd, ref WindowCompositionAttributeData data);

    /// <summary>
    /// Asks DWM to blur whatever is behind the window. This is the Windows answer
    /// to the page's `backdrop-filter`, which cannot work here: Chromium samples
    /// only page content, so an in-page blur over a transparent window resolves to
    /// black rather than to the timeline underneath. DWM composites a real blur of
    /// the desktop instead, and the page paints its surface on top of it.
    ///
    /// OFF by default, because it does not currently work: this window is layered
    /// (AllowsTransparency, which the page's rounded corners need), and on a layered
    /// window DWM paints the accent tint as a solid sheet rather than sampling what
    /// is behind it. The result is an opaque black rectangle filling the whole window
    /// rect - worse than no blur at all. Kept behind TNT_HELPER_BLUR=1 so the next
    /// attempt has the plumbing; making it actually blur means dropping
    /// AllowsTransparency and letting DWM own the corners too.
    /// </summary>
    public static void EnableBlurBehind(IntPtr hWnd)
    {
        if (Environment.GetEnvironmentVariable("TNT_HELPER_BLUR") != "1")
        {
            Log.Write("blur-behind off (set TNT_HELPER_BLUR=1 to try it)");
            return;
        }

        // 4 == ACCENT_ENABLE_ACRYLICBLURBEHIND. The gradient colour is ABGR and its
        // alpha is the tint DWM lays over the blur; keep it low so the page's own
        // surface decides the final colour.
        var policy = new AccentPolicy
        {
            AccentState = 4,
            AccentFlags = 2,
            GradientColor = 0x33161718,
            AnimationId = 0
        };

        var size = Marshal.SizeOf<AccentPolicy>();
        var buffer = Marshal.AllocHGlobal(size);
        try
        {
            Marshal.StructureToPtr(policy, buffer, false);
            var data = new WindowCompositionAttributeData
            {
                Attribute = 19, // WCA_ACCENT_POLICY
                Data = buffer,
                SizeOfData = size
            };
            var result = SetWindowCompositionAttribute(hWnd, ref data);
            Log.Write($"blur-behind applied, result {result}");
        }
        finally
        {
            Marshal.FreeHGlobal(buffer);
        }
    }

    /// <summary>
    /// A background process cannot normally take the foreground. Attaching to the
    /// current foreground thread's input queue for the duration of the call is the
    /// standard way around that, and is what makes the overlay actually receive
    /// typing after the hotkey.
    /// </summary>
    public static void ForceForeground(IntPtr hWnd)
    {
        var foreground = GetForegroundWindow();
        if (foreground == hWnd) return;

        var target = GetWindowThreadProcessId(foreground, out _);
        var self = GetCurrentThreadId();
        var attached = target != 0 && target != self && AttachThreadInput(self, target, true);
        SetForegroundWindow(hWnd);
        if (attached) AttachThreadInput(self, target, false);
    }
}

internal sealed class OverlayWindow : Window
{
    // Mirrors quickPanelControlName(forHotKeyId:) in the macOS helper.
    // Virtual-key codes are ASCII for A-Z, so 'A' == 0x41.
    private static readonly Dictionary<uint, string> ControlHotkeys = new()
    {
        ['A'] = "anchor",
        ['C'] = "composition",
        ['E'] = "ease",
        ['F'] = "mask",
        ['S'] = "styles",
        ['M'] = "mass-edit",
        ['T'] = "text-animation",
        ['O'] = "timing-order",
        ['X'] = "filter",
    };

    private const uint VkSpace = 0x20;
    private const uint VkEscape = 0x1B;

    private readonly WebView2 _webView = new();
    private readonly Canvas _hitShapes = new();
    private static readonly Brush HitFill = new SolidColorBrush(Color.FromArgb(1, 0, 0, 0));
    private readonly DispatcherTimer _visibility = new() { Interval = TimeSpan.FromMilliseconds(200) };
    private Native.HookProc? _hookProc;   // field, not a local: the hook holds a raw
    private IntPtr _hook = IntPtr.Zero;   // pointer and the delegate must outlive it
    private IntPtr _handle = IntPtr.Zero;
    private bool _ready;
    private bool _keepVisible;
    private int _bridgeCalls;

    public OverlayWindow()
    {
        // AllowsTransparency requires WindowStyle.None; together they give the
        // per-pixel alpha the page's rounded, translucent shell needs.
        WindowStyle = WindowStyle.None;
        AllowsTransparency = true;

        // Fully transparent, and it has to stay that way: any window-wide fill,
        // even at alpha 1/255, visibly tints the whole window rectangle (measured
        // at roughly 5% darkening), which reads as a faint rectangle around
        // floating layouts like the anchor panel. Clickability is supplied by
        // _hitShapes instead - see UpdateHitShapesAsync.
        // TNT_HELPER_HIT_ALPHA exists only to A/B this against the old whole-window
        // fill when something looks wrong; leave it unset.
        Background = byte.TryParse(
            Environment.GetEnvironmentVariable("TNT_HELPER_HIT_ALPHA"), out var legacyAlpha)
            ? new SolidColorBrush(Color.FromArgb(legacyAlpha, 0, 0, 0))
            : Brushes.Transparent;
        ResizeMode = ResizeMode.NoResize;
        ShowInTaskbar = false;
        Topmost = true;
        // Every Show() in this app is explicit about focus: the startup warm-up
        // must not steal it, and the hotkey path takes it deliberately via
        // Native.ForceForeground (which a background process needs anyway).
        ShowActivated = false;
        WindowStartupLocation = WindowStartupLocation.Manual;
        Width = 620;
        Height = 310;

        // Without this the WebView2 paints an opaque white sheet over the window's
        // transparency, regardless of the page's own transparent background.
        _webView.DefaultBackgroundColor = System.Drawing.Color.Transparent;

        // The canvas sits behind the WebView and carries the hit shapes. Order
        // matters: the page's own surfaces paint over them, so they are never seen.
        var root = new Grid();
        root.Children.Add(_hitShapes);
        root.Children.Add(_webView);
        Content = root;

        KeyDown += (_, e) => { if (e.Key == Key.Escape) Hide(); };
    }

    /// <summary>
    /// Creates the HWND without showing the window, installs the keyboard hook, and
    /// starts loading the page.
    /// </summary>
    public void Initialize()
    {
        var helper = new WindowInteropHelper(this);
        _handle = helper.EnsureHandle();

        _hookProc = OnKeyboardEvent;
        _hook = Native.SetWindowsHookEx(
            Native.WhKeyboardLl, _hookProc, Native.GetModuleHandle(null), 0);
        Log.Write(_hook == IntPtr.Zero
            ? $"hook FAILED, win32 error {Marshal.GetLastWin32Error()}"
            : $"started, hwnd 0x{_handle.ToInt64():X}, hook installed");

        Native.EnableBlurBehind(_handle);

        // The macOS helper hides the panel whenever another app activates. The same
        // guard here also covers AE quitting while the overlay is up.
        // Debug aid: the overlay hides the moment anything other than AE takes the
        // foreground, which makes it impossible to inspect from another process.
        _keepVisible = Environment.GetEnvironmentVariable("TNT_HELPER_NOHIDE") == "1";
        _visibility.Tick += (_, _) =>
        {
            if (!IsVisible || _keepVisible) return;
            if (!Native.IsAfterEffectsOrOverlayFrontmost(_handle)
                || Native.AfterEffectsWindow() == IntPtr.Zero)
            {
                Hide();
            }
        };
        _visibility.Start();

        // EnsureCoreWebView2Async throws if it is called before Application.Run
        // starts the dispatcher loop, and Initialize() runs before that by design
        // (the hook and the HWND have to exist first). Queueing the init makes it
        // run on the first idle turn of the loop instead. Getting this wrong is
        // invisible rather than loud: the hotkey still shows the window, but the
        // window is transparent with nothing in it.
        Dispatcher.BeginInvoke(
            DispatcherPriority.ApplicationIdle,
            new Action(() => _ = InitializeWebViewAsync()));
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
        try
        {
            await InitializeWebViewCoreAsync();
        }
        catch (Exception ex)
        {
            // Nothing observes this task, so without the log a missing WebView2
            // runtime or an unfindable quick.html would present as an overlay that
            // shows up perfectly transparent - i.e. as nothing at all.
            Log.Write($"webview init FAILED: {ex.GetType().Name}: {ex.Message}");
        }
    }

    private async Task InitializeWebViewCoreAsync()
    {
        // The WPF WebView2 control does not begin initialising until it is loaded
        // into a window that has actually been shown, so EnsureCoreWebView2Async
        // on a never-shown window waits forever - no error, just an overlay that
        // stays blank. Park the window off-screen, show it unfocused to let the
        // control come up, then hide it again before anyone sees it.
        Left = -32000;
        Top = -32000;
        Show();
        try
        {
            // Opt-in DevTools endpoint. The overlay has no menu and cannot be right-
        // clicked into an inspector, so without this the only way to diagnose a
        // rendering bug is to guess at CSS and ask the user to look. With it, the
        // page can be inspected and driven directly. Off unless asked for.
        var debugPort = Environment.GetEnvironmentVariable("TNT_HELPER_DEBUG_PORT");
        if (!string.IsNullOrWhiteSpace(debugPort))
        {
            var options = new CoreWebView2EnvironmentOptions
            {
                AdditionalBrowserArguments = $"--remote-debugging-port={debugPort}"
            };
            var environment = await CoreWebView2Environment.CreateAsync(null, null, options);
            await _webView.EnsureCoreWebView2Async(environment);
            Log.Write($"devtools listening on port {debugPort}");
        }
        else
        {
            await _webView.EnsureCoreWebView2Async();
        }
        }
        finally
        {
            Hide();
            // ShowActivated only had to be false for the warm-up above, so the
            // hidden window could not steal focus at startup. Leaving it false makes
            // every later Show() produce a window that never takes activation - it
            // paints, but clicks and typing do not reach it.
            ShowActivated = true;
        }
        var core = _webView.CoreWebView2;
        var root = ExtensionRoot();

        // Same bootstrap the macOS helper injects at document start.
        // __TNT_NATIVE_PLATFORM__ is the Windows-only marker. The macOS helper does
        // not set it, so every rule keyed off it is inert there - which is the point:
        // the Chromium/WebKit split below only needs fixing on this side.
        var bootstrap =
            $"window.__TNT_EXTENSION_PATH__ = {JsonSerializer.Serialize(root)};" +
            "window.__TNT_NATIVE_HELPER__ = true;" +
            "window.__TNT_NATIVE_PLATFORM__ = \"win\";";
        await core.AddScriptToExecuteOnDocumentCreatedAsync(bootstrap);

        core.WebMessageReceived += OnWebMessage;

        // quick.html links style.css with a hand-maintained ?v= string, so an edit
        // to the CSS without a version bump is served from WebView2's disk cache and
        // the page silently keeps the old styling. The overlay loads one small local
        // page once per launch; there is nothing worth caching.
        try
        {
            await core.CallDevToolsProtocolMethodAsync(
                "Network.setCacheDisabled", "{\"cacheDisabled\":true}");
        }
        catch (Exception ex)
        {
            Log.Write($"could not disable cache: {ex.Message}");
        }

        core.Navigate(new Uri(Path.Combine(root, "quick.html")).AbsoluteUri);
        _ready = true;
        Log.Write($"webview ready, root {root}");

        // In no-hide debug mode, put the overlay up immediately: it cannot be
        // summoned from another process, because the hotkey requires AE to be
        // frontmost and taking the foreground from a background process is blocked.
        if (_keepVisible) ShowOverlay(null);
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

            // Stand down from topmost for the duration of the call. Some scripts
            // open a native After Effects dialog - the colour picker behind every
            // swatch is the obvious one - and that dialog belongs to the AfterFX
            // process, so an always-on-top overlay paints straight over it and the
            // user cannot reach it. These calls block until the dialog closes, so
            // the window is exactly as long as the dialog is up.
            //
            // Counted rather than a bool: several requests can be in flight, and
            // the first to finish must not put the overlay back over a dialog a
            // later one is still showing.
            _bridgeCalls++;
            Topmost = false;
            string result;
            try
            {
                result = await PanelBridge.SendAsync(id, script);
            }
            finally
            {
                if (--_bridgeCalls <= 0)
                {
                    _bridgeCalls = 0;
                    Topmost = true;
                }
            }

            await EvaluateAsync(
                $"window.__tntNativeResolve({JsonSerializer.Serialize(id)}, {JsonSerializer.Serialize(result)});");
            return;
        }

        if (channel == "tntWindow")
        {
            var action = message.TryGetProperty("action", out var a) ? a.GetString() : null;
            if (action == "close") { Hide(); return; }

            // The page recomputes its hit shapes whenever its DOM changes and
            // pushes them here, so they stay correct for surfaces that appear
            // without changing the window size - an editor opening inside a
            // dialog, a drop-down, a context menu.
            if (action == "hitshapes" && message.TryGetProperty("rects", out var rects))
            {
                ApplyHitShapes(rects);
                return;
            }
            if (action == "resize"
                && message.TryGetProperty("width", out var w)
                && message.TryGetProperty("height", out var h))
            {
                // WPF sizes in DIPs; the page reports CSS pixels. Equal at 96 DPI,
                // and WebView2 already scales its contents per-monitor above that.
                var width = w.GetDouble();
                var height = h.GetDouble();
                if (width <= 0 || height <= 0) return;
                // Re-centre over AE at the new size, the way the macOS helper
                // re-runs afterEffectsOverlayFrame on every resize.
                PlaceOverAfterEffects(width, height);
                // The panel's shape just changed, so the hit shapes have to follow.
                await UpdateHitShapesAsync();
            }
        }
    }

    /// <summary>
    /// Rebuilds the invisible WPF rectangles that make the overlay clickable.
    ///
    /// They exist only to put non-zero alpha into WPF's layered-window bitmap under
    /// the places the page actually paints. Windows hit-tests a per-pixel-alpha
    /// layered window against that bitmap, and WebView2 contributes nothing to it,
    /// so without these the overlay is visible but entirely click-through. They are
    /// drawn behind the WebView and covered by the page's own opaque surfaces, so
    /// they are never seen - and the gaps between floating cards stay transparent,
    /// which keeps clicks there falling through to After Effects.
    /// </summary>
    private async Task UpdateHitShapesAsync()
    {
        if (!_ready) return;

        string json;
        try
        {
            json = await _webView.CoreWebView2.ExecuteScriptAsync(
                "JSON.stringify(window.__tntQuickPanelHitRects ? window.__tntQuickPanelHitRects() : [])");
        }
        catch (InvalidOperationException)
        {
            return;
        }

        try
        {
            // ExecuteScriptAsync returns the result as a JSON string literal.
            var inner = JsonSerializer.Deserialize<string>(json);
            if (string.IsNullOrEmpty(inner)) return;

            using var document = JsonDocument.Parse(inner);
            ApplyHitShapes(document.RootElement);
        }
        catch (JsonException ex)
        {
            Log.Write($"hit shapes unparsable: {ex.Message}");
        }
    }

    private void ApplyHitShapes(JsonElement rects)
    {
        _hitShapes.Children.Clear();
        try
        {
            foreach (var entry in rects.EnumerateArray())
            {
                var radius = entry.GetProperty("r").GetDouble();
                var shape = new System.Windows.Shapes.Rectangle
                {
                    Width = entry.GetProperty("w").GetDouble(),
                    Height = entry.GetProperty("h").GetDouble(),
                    RadiusX = radius,
                    RadiusY = radius,
                    // Alpha 1/255, not opaque black. These only need to be non-zero
                    // in the layered window's alpha channel for the hit test; any
                    // visible colour shows through the page's 95%-opaque surfaces
                    // and along any rounding overhang. Confined to the panel
                    // rectangles, a 1/255 tint is not the whole-window wash that
                    // made this necessary in the first place.
                    Fill = HitFill
                };
                Canvas.SetLeft(shape, entry.GetProperty("x").GetDouble());
                Canvas.SetTop(shape, entry.GetProperty("y").GetDouble());
                _hitShapes.Children.Add(shape);
            }
        }
        catch (Exception ex)
        {
            Log.Write($"hit shapes unusable: {ex.Message}");
        }
        finally
        {
            Log.Write($"hit shapes: {_hitShapes.Children.Count}");
        }
    }

    private async Task EvaluateAsync(string javaScript)
    {
        if (!_ready) return;
        try { await _webView.CoreWebView2.ExecuteScriptAsync(javaScript); }
        catch (InvalidOperationException) { /* webview torn down */ }
    }

    /// <summary>
    /// Low-level keyboard hook. RegisterHotKey was the wrong primitive: it claims
    /// its combinations system-wide, so the helper would eat Ctrl+C / Ctrl+S / Ctrl+X
    /// in every other app for as long as it ran. A hook can look at what is
    /// frontmost first and only swallow the key when After Effects (or this overlay)
    /// owns the foreground; everywhere else the key passes straight through.
    /// </summary>
    private IntPtr OnKeyboardEvent(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode < 0) return Native.CallNextHookEx(_hook, nCode, wParam, lParam);

        var message = wParam.ToInt32();
        if (message != Native.WmKeyDown && message != Native.WmSysKeyDown)
            return Native.CallNextHookEx(_hook, nCode, wParam, lParam);

        var info = Marshal.PtrToStructure<Native.KbdLlHookStruct>(lParam);
        var key = info.vkCode;

        // Escape closes the overlay whenever the overlay itself has focus. The page
        // handles it too, but the WebView can be mid-load or focus can sit on the
        // chrome, and a stuck overlay over AE is worse than a duplicate hide.
        if (key == VkEscape && IsVisible && Native.GetForegroundWindow() == _handle)
        {
            Dispatcher.BeginInvoke(new Action(Hide));
            return new IntPtr(1);
        }

        if (!IsControlOnly()) return Native.CallNextHookEx(_hook, nCode, wParam, lParam);

        string? control;
        if (key == VkSpace) control = null;
        else if (ControlHotkeys.TryGetValue(key, out var name)) control = name;
        else return Native.CallNextHookEx(_hook, nCode, wParam, lParam);

        // The frontmost check is what keeps Ctrl+S in a text editor working.
        if (!Native.IsAfterEffectsOrOverlayFrontmost(_handle))
        {
            Log.Write($"chord vk 0x{key:X} ignored, AE not frontmost");
            return Native.CallNextHookEx(_hook, nCode, wParam, lParam);
        }

        Log.Write($"chord vk 0x{key:X} -> {control ?? "(launcher)"}");

        var toggle = key == VkSpace;
        Dispatcher.BeginInvoke(new Action(() =>
        {
            if (toggle && IsVisible && Native.GetForegroundWindow() == _handle) Hide();
            else ShowOverlay(control);
        }));
        return new IntPtr(1);
    }

    private static bool Down(int key) => (Native.GetAsyncKeyState(key) & 0x8000) != 0;

    /// <summary>Ctrl held, nothing else - matching the macOS control-only chords.</summary>
    private static bool IsControlOnly() =>
        Down(Native.VkControl)
        && !Down(Native.VkShift)
        && !Down(Native.VkMenu)
        && !Down(Native.VkLWin)
        && !Down(Native.VkRWin);

    /// <summary>
    /// Sizes and positions the overlay over After Effects, in DIPs, through WPF's
    /// own Left/Top/Width/Height.
    ///
    /// It matters that this does not call SetWindowPos. Moving the HWND directly
    /// resizes the window without WPF ever running a layout pass, and the hosted
    /// WebView2 takes its viewport from that layout - so the window would shrink to
    /// 620x320 while the page kept laying out at its previous size (1281x1032 in the
    /// case that surfaced this). The shell is `position: fixed; inset: 8px`, so it
    /// stretched to that stale viewport and the window showed only its top-left
    /// corner: a large flat rectangle with the content cropped out of view.
    /// </summary>
    private bool PlaceOverAfterEffects(double widthDip, double heightDip)
    {
        var scale = Native.DpiScale(_handle);
        var widthPx = (int)Math.Round(widthDip * scale);
        var heightPx = (int)Math.Round(heightDip * scale);
        if (!Native.TryGetOverlayOrigin(widthPx, heightPx, out var x, out var y))
        {
            // No AE window to anchor to. Still apply the size: dropping it leaves
            // the window at whatever the previous panel needed, and a panel wider
            // than that window has its right-hand controls outside the window
            // entirely, where they render but cannot be clicked.
            Width = widthDip;
            Height = heightDip;
            Log.Write($"place {widthDip}x{heightDip} sized only, no usable AE window");
            return false;
        }
        Log.Write($"place {widthDip}x{heightDip} dip at {x},{y} px (scale {scale})");

        Width = widthDip;
        Height = heightDip;
        Left = x / scale;
        Top = y / scale;
        return true;
    }

    private void ShowOverlay(string? control)
    {
        // No AE window means nothing to sit over, and the bridge would fail anyway.
        if (!PlaceOverAfterEffects(Width, Height))
        {
            Log.Write("show aborted, no usable After Effects window");
            Hide();
            return;
        }

        if (!IsVisible) Show();
        Topmost = true;
        Native.ForceForeground(_handle);
        // ForceForeground moves the OS foreground; Activate/Focus move WPF's own
        // notion of the active window and put keyboard focus inside the WebView.
        // Without these the overlay can sit in front while input still goes to AE.
        Activate();
        _webView.Focus();
        Log.Write($"shown {Width}x{Height} dip at {Left},{Top} " +
                  $"(actual {ActualWidth}x{ActualHeight}, webview {_webView.ActualWidth}x{_webView.ActualHeight}), " +
                  $"ready={_ready}");

        // Give the page the same beat the macOS helper does before driving it, so a
        // freshly shown WebView has finished its first paint.
        var script = control is null
            ? "if (window.__tntQuickPanelDidShow) await window.__tntQuickPanelDidShow();"
            : "if (window.__tntQuickPanelOpenControl) await window.__tntQuickPanelOpenControl("
              + JsonSerializer.Serialize(control) + ");";

        var timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(80) };
        timer.Tick += async (_, _) =>
        {
            timer.Stop();
            await EvaluateAsync("(async function () { window.focus(); " + script + " }());");
            await UpdateHitShapesAsync();
        };
        timer.Start();
    }

    protected override void OnClosed(EventArgs e)
    {
        _visibility.Stop();
        if (_hook != IntPtr.Zero)
        {
            Native.UnhookWindowsHookEx(_hook);
            _hook = IntPtr.Zero;
        }
        base.OnClosed(e);
    }
}
