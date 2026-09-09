import Cocoa
import Carbon
import ApplicationServices

// Written to ~/.ae-fx-quick-controls/helper.log. The app has no window and no
// console, so a failed hotkey otherwise leaves nothing to read.
func tntLog(_ message: String) {
    let directory = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent(".ae-fx-quick-controls")
    try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    let file = directory.appendingPathComponent("helper.log")
    let line = "\(Date()) \(message)\n"
    guard let data = line.data(using: .utf8) else { return }
    if let handle = try? FileHandle(forWritingTo: file) {
        handle.seekToEndOfFile()
        handle.write(data)
        try? handle.close()
    } else {
        try? data.write(to: file)
    }
}
import Network
import WebKit

private let quickControlsLauncherSize = NSSize(width: 620, height: 310)
private let quickControlsHotKeySignature = OSType(
    UInt32(UInt8(ascii: "T")) << 24 |
    UInt32(UInt8(ascii: "N")) << 16 |
    UInt32(UInt8(ascii: "T")) << 8 |
    UInt32(UInt8(ascii: "Q"))
)
private weak var activeAppDelegate: AppDelegate?

// The panel cannot talk to this process - the loopback bridge runs the other
// way, and `open` on a running app passes it nothing - so a group scope is
// handed over through a file beside bridge.json, written by
// TNT_writeQuickPanelScope. Read once and deleted, and ignored if stale, so a
// scope left behind by a crash cannot hijack the next plain summon.
private func takePendingQuickPanelScope() -> String? {
    let url = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent(".ae-fx-quick-controls")
        .appendingPathComponent("scope.json")
    guard
        let data = try? Data(contentsOf: url),
        let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
        let group = object["group"] as? String,
        !group.isEmpty
    else {
        return nil
    }
    try? FileManager.default.removeItem(at: url)
    let stamp = (object["ts"] as? Double) ?? 0
    let ageSeconds = (Date().timeIntervalSince1970 * 1000 - stamp) / 1000
    guard ageSeconds < 10 else { return nil }
    return group
}

// Window sizes per surface, kept across launches. Without this the first open
// of every panel in a session still has to grow from the launcher size, which
// is the movement that reads as an animation.
private func quickPanelSizesURL() -> URL {
    FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent(".ae-fx-quick-controls")
        .appendingPathComponent("panel-sizes.json")
}

private func loadQuickPanelSizes() -> [String: NSSize] {
    guard
        let data = try? Data(contentsOf: quickPanelSizesURL()),
        let raw = try? JSONSerialization.jsonObject(with: data) as? [String: [String: Double]]
    else {
        return [:]
    }
    var sizes: [String: NSSize] = [:]
    raw.forEach { key, value in
        if let w = value["w"], let h = value["h"], w > 0, h > 0 {
            sizes[key] = NSSize(width: w, height: h)
        }
    }
    return sizes
}

private func saveQuickPanelSizes(_ sizes: [String: NSSize]) {
    var raw: [String: [String: Double]] = [:]
    sizes.forEach { key, size in raw[key] = ["w": size.width, "h": size.height] }
    guard let data = try? JSONSerialization.data(withJSONObject: raw) else { return }
    let url = quickPanelSizesURL()
    try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
    try? data.write(to: url)
}

private func quickPanelControlName(forHotKeyId id: UInt32) -> String? {
    switch id {
    case 10: return "anchor"
    case 11: return "composition"
    case 12: return "ease"
    case 13: return "mask"
    case 14: return "styles"
    case 15: return "mass-edit"
    case 16: return "text-animation"
    case 17: return "timing-order"
    case 19: return "tnk"
    default: return nil
    }
}

private func quickPanelControlName(for event: NSEvent) -> String? {
    let flags = event.modifierFlags.intersection(.deviceIndependentFlagsMask)
    guard flags.contains(.control),
          !flags.contains(.command),
          !flags.contains(.option),
          !flags.contains(.shift)
    else {
        return nil
    }

    guard let character = event.charactersIgnoringModifiers?.lowercased(), character.count == 1 else {
        return nil
    }
    switch character {
    case "a": return "anchor"
    case "c": return "composition"
    case "e": return "ease"
    case "f": return "mask"
    case "s": return "styles"
    case "m": return "mass-edit"
    case "t": return "text-animation"
    case "o": return "timing-order"
    default: return nil
    }
}

private func isQuickPanelSummonShortcut(_ event: NSEvent) -> Bool {
    let flags = event.modifierFlags.intersection(.deviceIndependentFlagsMask)
    guard flags.contains(.control),
          !flags.contains(.command),
          !flags.contains(.option),
          !flags.contains(.shift)
    else {
        return false
    }

    if event.keyCode == kVK_Space || event.keyCode == kVK_ANSI_K {
        return true
    }
    let character = event.charactersIgnoringModifiers?.lowercased()
    return character == " " || character == "k"
}


private func javaScriptLiteral(_ value: String) -> String {
    let data = try? JSONSerialization.data(withJSONObject: [value], options: [])
    guard
        let data,
        let array = String(data: data, encoding: .utf8),
        array.count >= 2
    else {
        return "\"\""
    }
    return String(array.dropFirst().dropLast())
}

private func afterEffectsApplication() -> NSRunningApplication? {
    NSRunningApplication.runningApplications(withBundleIdentifier: afterEffectsBundleIdentifier).first
}

// Every live instance holds the Carbon hot keys, and only one process can own a
// given combination. A survivor therefore does not just waste memory - it takes
// the whole shortcut set, and the new instance registers nothing.
//
// Two things were wrong here. runningApplications(withBundleIdentifier:) only
// sees instances LaunchServices started, so anything run straight from
// Contents/MacOS - which is what the launch script's `open || nohup` fallback
// does when `open` fails - was invisible and survived. And termination was
// asynchronous while registerGlobalHotKeys() ran immediately afterwards, so even
// a visible duplicate usually still owned the keys at that moment.
private func quickControlsDuplicatePIDs() -> [pid_t] {
    let currentPID = ProcessInfo.processInfo.processIdentifier
    var pids: [pid_t] = []
    if let bundleIdentifier = Bundle.main.bundleIdentifier {
        NSRunningApplication.runningApplications(withBundleIdentifier: bundleIdentifier).forEach { application in
            let pid = application.processIdentifier
            if pid != currentPID && !pids.contains(pid) { pids.append(pid) }
        }
    }
    // Catches the bare-executable launches LaunchServices never registered.
    let probe = Process()
    probe.executableURL = URL(fileURLWithPath: "/usr/bin/pgrep")
    probe.arguments = ["-x", "AEFXQuickControls"]
    let pipe = Pipe()
    probe.standardOutput = pipe
    probe.standardError = FileHandle.nullDevice
    if (try? probe.run()) != nil {
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        probe.waitUntilExit()
        String(data: data, encoding: .utf8)?
            .split(whereSeparator: { $0.isNewline })
            .forEach { line in
                guard let pid = pid_t(line.trimmingCharacters(in: .whitespaces)),
                      pid != currentPID, !pids.contains(pid) else { return }
                pids.append(pid)
            }
    }
    return pids
}

private func terminateDuplicateQuickControlsInstances() {
    let duplicates = quickControlsDuplicatePIDs()
    guard !duplicates.isEmpty else { return }
    tntLog("found \(duplicates.count) older instance(s) holding the hot keys: \(duplicates)")
    duplicates.forEach { kill($0, SIGTERM) }
    // Block until they are actually gone. Returning early hands the new instance
    // a keyboard the old one still owns.
    let deadline = Date().addingTimeInterval(1.5)
    while Date() < deadline {
        let remaining = duplicates.filter { kill($0, 0) == 0 }
        if remaining.isEmpty {
            tntLog("older instance(s) exited")
            return
        }
        usleep(40_000)
    }
    let stubborn = duplicates.filter { kill($0, 0) == 0 }
    stubborn.forEach { kill($0, SIGKILL) }
    if !stubborn.isEmpty {
        tntLog("force-killed \(stubborn.count) instance(s) that ignored SIGTERM")
        usleep(200_000)
    }
}

private func appKitRect(forCGWindowRect cgRect: CGRect) -> NSRect? {
    for screen in NSScreen.screens {
        guard
            let screenNumber = screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber
        else {
            continue
        }
        let displayBounds = CGDisplayBounds(CGDirectDisplayID(screenNumber.uint32Value))
        guard displayBounds.intersects(cgRect) else { continue }
        return NSRect(
            x: screen.frame.minX + cgRect.minX - displayBounds.minX,
            y: screen.frame.maxY - (cgRect.maxY - displayBounds.minY),
            width: cgRect.width,
            height: cgRect.height
        )
    }
    return nil
}

private func afterEffectsWindowFrame() -> NSRect? {
    guard let application = afterEffectsApplication() else { return nil }
    let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
    guard let windows = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: Any]] else {
        return nil
    }
    return windows.compactMap { info -> NSRect? in
        guard
            let ownerPID = info[kCGWindowOwnerPID as String] as? NSNumber,
            ownerPID.int32Value == application.processIdentifier,
            let layer = info[kCGWindowLayer as String] as? NSNumber,
            layer.intValue == 0,
            let bounds = info[kCGWindowBounds as String] as? NSDictionary
        else {
            return nil
        }
        var cgRect = CGRect.zero
        guard CGRectMakeWithDictionaryRepresentation(bounds, &cgRect),
              cgRect.width > 420, cgRect.height > 300 else {
            return nil
        }
        return appKitRect(forCGWindowRect: cgRect)
    }.max(by: { $0.width * $0.height < $1.width * $1.height })
}

private func afterEffectsOverlayFrame(for size: NSSize) -> NSRect? {
    guard let aeFrame = afterEffectsWindowFrame() else { return nil }
    let timelineCenter = NSPoint(
        x: aeFrame.midX,
        y: aeFrame.minY + aeFrame.height * 0.21
    )
    var frame = NSRect(
        x: timelineCenter.x - size.width / 2,
        y: timelineCenter.y - size.height / 2,
        width: size.width,
        height: size.height
    )
    if let screen = NSScreen.screens.first(where: { $0.visibleFrame.intersects(aeFrame) }) {
        let visible = screen.visibleFrame
        frame.origin.x = min(max(frame.origin.x, visible.minX + 12), visible.maxX - size.width - 12)
        frame.origin.y = min(max(frame.origin.y, visible.minY + 12), visible.maxY - size.height - 12)
    }
    return frame
}

private func afterEffectsOverlayFrame(near point: NSPoint, size: NSSize) -> NSRect {
    var frame = NSRect(
        x: point.x + 10,
        y: point.y - size.height - 10,
        width: size.width,
        height: size.height
    )
    let aeFrame = afterEffectsWindowFrame()
    let screenFrame = aeFrame.flatMap { ae in
        NSScreen.screens.first(where: { $0.visibleFrame.intersects(ae) })?.visibleFrame
    } ?? NSScreen.screens.first(where: { $0.visibleFrame.contains(point) })?.visibleFrame
      ?? NSScreen.main?.visibleFrame
      ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
    frame.origin.x = min(max(frame.origin.x, screenFrame.minX + 12), screenFrame.maxX - size.width - 12)
    frame.origin.y = min(max(frame.origin.y, screenFrame.minY + 12), screenFrame.maxY - size.height - 12)
    return frame
}

private func isControlRightMouseDown(_ event: CGEvent) -> Bool {
    let flags = event.flags
    return flags.contains(.maskControl) &&
        !flags.contains(.maskCommand) &&
        !flags.contains(.maskAlternate) &&
        !flags.contains(.maskShift)
}

private func accessibilityTrustedNoPrompt() -> Bool {
    AXIsProcessTrusted()
}

private final class AfterEffectsBridge: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?
    var onExecutionStarted: (() -> Void)?
    var onExecutionFinished: (() -> Void)?
    private let executionQueue = DispatchQueue(label: "com.tnk.ae.fx.quickcontrols.jsx", qos: .userInitiated)

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard
            let payload = message.body as? [String: Any],
            let requestId = payload["id"] as? String,
            let script = payload["script"] as? String
        else {
            return
        }

        onExecutionStarted?()
        sendToPanelBridge(
            requestId: requestId,
            script: script,
            queue: executionQueue
        ) { [weak self] result in
            DispatchQueue.main.async {
                self?.webView?.evaluateJavaScript(
                    "window.__tntNativeResolve(\(javaScriptLiteral(requestId)), \(javaScriptLiteral(result)));"
                ) { _, _ in
                    self?.onExecutionFinished?()
                }
            }
        }
    }
}

private final class WindowBridge: NSObject, WKScriptMessageHandler {
    weak var panel: NSPanel?

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard
            let payload = message.body as? [String: Any],
            let panel
        else {
            return
        }
        let action = payload["action"] as? String ?? "resize"
        if action == "close" {
            panel.orderOut(nil)
            return
        }
        guard
            let width = payload["width"] as? Double,
            let height = payload["height"] as? Double
        else {
            return
        }

        let aeFrame = afterEffectsWindowFrame()
        let screenFrame = aeFrame.flatMap { frame in
            NSScreen.screens.first(where: { $0.visibleFrame.intersects(frame) })?.visibleFrame
        } ?? NSScreen.main?.visibleFrame ?? .zero
        let maximumWidth = max(420, screenFrame.width - 48)
        let maximumHeight = max(240, screenFrame.height - 48)
        let size = NSSize(
            width: min(max(width, 380), maximumWidth),
            height: min(max(height, 180), maximumHeight)
        )
        let frame = afterEffectsOverlayFrame(for: size) ?? NSRect(origin: panel.frame.origin, size: size)
        activeAppDelegate?.rememberQuickPanelSize(size)
        // A window that is already on screen must never change size where it can
        // be seen. If the size actually differs, hide, resize, show - which is
        // instant and cannot read as a scale.
        let sizeChanges = abs(panel.frame.width - frame.width) > 0.5 || abs(panel.frame.height - frame.height) > 0.5
        let wasVisible = panel.isVisible && panel.alphaValue > 0
        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0
            context.allowsImplicitAnimation = false
            if sizeChanges && wasVisible { panel.alphaValue = 0 }
            panel.setFrame(frame, display: true, animate: false)
            if sizeChanges && wasVisible { panel.alphaValue = 1 }
        }
        // Reveal once sizes settle, not on the first one.
        // Was 70ms after every resize. One frame is enough to let the second
        // resize the page schedules arrive and coalesce.
        activeAppDelegate?.scheduleReveal(after: 0.016)
    }
}

private final class BorderlessPanel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { true }
}

private final class DragStrip: NSView {
    override func mouseDown(with event: NSEvent) {
        window?.performDrag(with: event)
    }
}

private final class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    private var panel: BorderlessPanel?
    private var pendingRevealWorkItem: DispatchWorkItem?
    // The window opens at the launcher size and is resized once the page has
    // measured itself, and afterEffectsOverlayFrame centres it - so it grows
    // from the middle outward. Hiding it during the resize helps, but the fix
    // is to not resize at all: every surface's settled size is remembered and
    // the window opens at it. Only the very first summon of a given panel can
    // still change size.
    private var lastSizeByControl: [String: NSSize] = loadQuickPanelSizes()
    private var showingControlName: String = "launcher"
    private var bridge: AfterEffectsBridge?
    private var windowBridge: WindowBridge?
    private weak var webView: WKWebView?
    private var escapeMonitor: Any?
    private var globalShortcutMonitor: Any?
    private var rightClickFallbackMonitor: Any?
    private var hotKeyEventHandler: EventHandlerRef?
    private var hotKeyRefs: [EventHotKeyRef] = []
    private var rightClickEventTap: CFMachPort?
    private var rightClickRunLoopSource: CFRunLoopSource?
    private var workspaceObservers: [NSObjectProtocol] = []
    private var visibilityTimer: Timer?
    private var activeBridgeExecutions = 0
    private var bridgeFocusGraceUntil = Date.distantPast
    private let launchInBackground = CommandLine.arguments.contains("--background")
    private var loggedAccessibilitySkip = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        terminateDuplicateQuickControlsInstances()
        activeAppDelegate = self
        guard let extensionRoot = extensionRootURL() else {
            // This used to terminate in silence, which is indistinguishable from
            // "the listener stopped working" with nothing to read anywhere.
            tntLog("FATAL: could not resolve the extension root; the helper cannot load the panel page. Exiting.")
            NSApp.terminate(nil)
            return
        }
        tntLog("launched: extension root \(extensionRoot.path)")

        let configuration = WKWebViewConfiguration()
        let controller = WKUserContentController()
        let bridge = AfterEffectsBridge()
        let windowBridge = WindowBridge()
        controller.add(bridge, name: "tntAE")
        controller.add(windowBridge, name: "tntWindow")

        let rootPath = extensionRoot.path
        let bootstrap = """
        window.__TNT_EXTENSION_PATH__ = \(javaScriptLiteral(rootPath));
        window.__TNT_NATIVE_HELPER__ = true;
        """
        controller.addUserScript(
            WKUserScript(source: bootstrap, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        )
        configuration.userContentController = controller

        let panel = BorderlessPanel(
            contentRect: NSRect(origin: .zero, size: quickControlsLauncherSize),
            styleMask: [.borderless, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        panel.delegate = self
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        // AppKit animates a panel in and out by default - for NSPanel that is
        // the utility-window behaviour, a scale from the centre. It is not the
        // resize and it is not CSS; it is the system's own window animation,
        // which is why it survived hiding the window during the resize and
        // opening at a remembered size.
        panel.animationBehavior = .none
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.isMovableByWindowBackground = false
        panel.hidesOnDeactivate = false
        panel.titleVisibility = .hidden
        panel.titlebarAppearsTransparent = true

        let rootView = NSView(frame: panel.contentView?.bounds ?? .zero)
        rootView.autoresizingMask = [.width, .height]
        rootView.wantsLayer = true
        rootView.layer?.backgroundColor = NSColor.clear.cgColor
        panel.contentView = rootView

        let webView = WKWebView(frame: rootView.bounds, configuration: configuration)
        webView.autoresizingMask = [.width, .height]
        webView.setValue(false, forKey: "drawsBackground")
        webView.underPageBackgroundColor = .clear
        webView.wantsLayer = true
        webView.layer?.backgroundColor = NSColor.clear.cgColor
        rootView.addSubview(webView)

        let dragStrip = DragStrip(frame: NSRect(x: 18, y: rootView.bounds.height - 18, width: rootView.bounds.width - 36, height: 12))
        dragStrip.autoresizingMask = [.width, .minYMargin]
        dragStrip.wantsLayer = true
        dragStrip.layer?.backgroundColor = NSColor.clear.cgColor
        rootView.addSubview(dragStrip)

        bridge.webView = webView
        bridge.onExecutionStarted = { [weak self] in
            guard let self else { return }
            self.activeBridgeExecutions += 1
            self.bridgeFocusGraceUntil = Date().addingTimeInterval(1.0)
        }
        bridge.onExecutionFinished = { [weak self] in
            guard let self else { return }
            self.activeBridgeExecutions = max(0, self.activeBridgeExecutions - 1)
            self.bridgeFocusGraceUntil = Date().addingTimeInterval(0.35)
            if self.activeBridgeExecutions == 0 {
                self.restorePanelFocusAfterBridgeExecution()
            }
        }
        windowBridge.panel = panel
        self.bridge = bridge
        self.windowBridge = windowBridge
        webView.uiDelegate = self
        self.webView = webView
        self.panel = panel

        let quickPage = extensionRoot.appendingPathComponent("quick.html")
        webView.loadFileURL(quickPage, allowingReadAccessTo: extensionRoot)

        if let frame = afterEffectsOverlayFrame(for: quickControlsLauncherSize) {
            panel.setFrame(frame, display: false)
        }

        NSApp.setActivationPolicy(.accessory)
        // The NSEvent global monitor duplicates the Carbon hot keys, so running both
        // fires every shortcut twice. It is also the only thing here that needs an
        // Accessibility grant, so it stays off unless Carbon registration failed.
        var carbonHotKeysReady = registerGlobalHotKeys()
        // The kernel does not always release a departed owner's hot keys by the
        // time we ask. Retry briefly before falling back to the monitor that
        // needs an Accessibility grant.
        var attempt = 0
        while !carbonHotKeysReady && attempt < 5 {
            attempt += 1
            usleep(120_000)
            unregisterGlobalHotKeys()
            carbonHotKeysReady = registerGlobalHotKeys()
        }
        if attempt > 0 {
            tntLog("hotkeys: settled after \(attempt) retry attempt(s), ready=\(carbonHotKeysReady)")
        }
        startControlRightClickMonitor()
        if !carbonHotKeysReady {
            startGlobalShortcutFallbackMonitor()
        }
        startApplicationVisibilityMonitor()
        if !launchInBackground {
            showPanel()
        }

        escapeMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if event.keyCode == 53 {
                self?.panel?.orderOut(nil)
                return nil
            }
            if let controlName = quickPanelControlName(for: event) {
                self?.openQuickPanelControl(controlName)
                return nil
            }
            if isQuickPanelSummonShortcut(event) {
                self?.togglePanelFromHotKey()
                return nil
            }
            return event
        }
    }

    func windowWillClose(_ notification: Notification) {
        panel?.orderOut(nil)
    }

    func windowDidResignKey(_ notification: Notification) {
        scheduleDismissAfterResign()
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        showPanel()
        return true
    }

    func applicationWillTerminate(_ notification: Notification) {
        if let escapeMonitor {
            NSEvent.removeMonitor(escapeMonitor)
        }
        if let globalShortcutMonitor {
            NSEvent.removeMonitor(globalShortcutMonitor)
        }
        if let rightClickFallbackMonitor {
            NSEvent.removeMonitor(rightClickFallbackMonitor)
        }
        unregisterGlobalHotKeys()
        stopControlRightClickMonitor()
        workspaceObservers.forEach {
            NSWorkspace.shared.notificationCenter.removeObserver($0)
        }
        visibilityTimer?.invalidate()
        activeAppDelegate = nil
    }

    /// Reveals the panel once resizes stop arriving. scheduleNativeQuickPanelResize
    /// deliberately measures across two animation frames, so a single open can send
    /// two sizes; revealing on the first would show the second as a visible jump.
    // Every path that puts the window on screen goes through here. There were
    // four, each ordering the panel front on its own, and any one of them left
    // untouched brings the animation back.
    private func presentPanelWithoutAnimation(_ panel: NSPanel, makeKey: Bool = true) {
        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0
            context.allowsImplicitAnimation = false
            if NSApp.isHidden { NSApp.unhide(nil) }
            NSApp.activate(ignoringOtherApps: true)
            if makeKey { panel.makeKeyAndOrderFront(nil) }
            panel.orderFrontRegardless()
        }
    }

    func rememberQuickPanelSize(_ size: NSSize) {
        guard lastSizeByControl[showingControlName] != size else { return }
        lastSizeByControl[showingControlName] = size
        saveQuickPanelSizes(lastSizeByControl)
    }

    func scheduleReveal(after delay: TimeInterval) {
        guard let panel, panel.alphaValue < 1 else { return }
        pendingRevealWorkItem?.cancel()
        let work = DispatchWorkItem { [weak self] in
            self?.pendingRevealWorkItem = nil
            guard let panel = self?.panel, panel.alphaValue < 1 else { return }
            NSAnimationContext.runAnimationGroup { context in
                context.duration = 0
                context.allowsImplicitAnimation = false
                panel.alphaValue = 1
            }
        }
        pendingRevealWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: work)
    }


    // Timing for the show path. The web layer boots in 62ms and an After
    // Effects call round-trips in 20, so a slow summon is native, and without
    // a number there is nothing to point at.
    private func showPanel(openControl controlName: String? = nil) {
        let showStartedAt = Date()
        defer {
            let ms = Int(Date().timeIntervalSince(showStartedAt) * 1000)
            if ms > 250 { tntLog("showPanel took \(ms)ms\(controlName.map { " for " + $0 } ?? "")") }
        }
        showingControlName = controlName ?? "launcher"
        let openingSize = lastSizeByControl[showingControlName] ?? quickControlsLauncherSize
        guard let panel, let frame = afterEffectsOverlayFrame(for: openingSize) else {
            panel?.orderOut(nil)
            return
        }
        // The window opens at the launcher size and is resized once the page has
        // measured its content. afterEffectsOverlayFrame centres it, so growing
        // from 620px to a wider panel expands from the middle outward on both
        // sides - which reads as a scale animation even though animate is false
        // and it is one discrete jump.
        //
        // The cure is to not be visible while it happens: go transparent, take
        // the resize, then reveal. This used to apply only when the panel was
        // hidden, so summoning a subpanel while the launcher was already up
        // showed the whole grow.
        // A group scope resizes the same way, so it defers too. Read here rather
        // than at the evaluate below, since the decision is needed now.
        let pendingGroup = controlName == nil ? takePendingQuickPanelScope() : nil
        // Always. The window only has to grow when its size is not yet known,
        // which is the first open of any surface in a session - exactly the
        // case the old condition let through.
        let deferReveal = true
        pendingRevealWorkItem?.cancel()
        pendingRevealWorkItem = nil
        // Everything that puts the window on screen, with implicit animation off
        // for the whole block. animationBehavior alone is not enough: AppKit
        // will still run implicit CoreAnimation on alphaValue and setFrame, and
        // NSApp.unhide animates the app's windows back in - which is a scale.
        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0
            context.allowsImplicitAnimation = false
            panel.alphaValue = deferReveal ? 0 : 1
            panel.setFrame(frame, display: true, animate: false)
            // Only unhide when the app is actually hidden. Calling it every time
            // asks AppKit to re-show windows that were never hidden, animation
            // and all.
        }
        presentPanelWithoutAnimation(panel)

        if deferReveal {
            // Safety net: reveal anyway if the page never reports a size.
            // The safety net is what made the first launch animate: with no
            // remembered size the window is at the launcher size, and revealing
            // on a timer showed it there and let the resize be seen. When the
            // size is already known the page only has to confirm it, so a short
            // net is safe; when it is not, wait long enough for the real size
            // to arrive and reveal at it.
            let sizeIsKnown = lastSizeByControl[showingControlName] != nil
            scheduleReveal(after: sizeIsKnown ? 0.18 : 0.9)
        }

        // Was 80ms. The page is already loaded and idle - it does not need time
        // to become ready, and every millisecond here is spent with the window
        // invisible, so it is the most expensive delay in the path.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.005) { [weak self] in
            let showScript: String
            if let controlName {
                showScript = "if (window.__tntQuickPanelOpenControl) await window.__tntQuickPanelOpenControl(\(javaScriptLiteral(controlName)));"
            } else if let pendingGroup {
                showScript = "if (window.__tntQuickPanelOpenGroup) await window.__tntQuickPanelOpenGroup(\(javaScriptLiteral(pendingGroup)));"
            } else {
                showScript = "if (window.__tntQuickPanelDidShow) await window.__tntQuickPanelDidShow();"
            }
            self?.webView?.evaluateJavaScript("""
            (async function () {
                window.focus();
                \(showScript)
            }());
            """)
        }
    }

    private func showLayerMenuAtMouseLocation() {
        guard afterEffectsApplication() != nil else {
            panel?.orderOut(nil)
            return
        }
        let helperBundleIdentifier = Bundle.main.bundleIdentifier ?? ""
        let frontmostBundleIdentifier = NSWorkspace.shared.frontmostApplication?.bundleIdentifier ?? ""
        guard
            frontmostBundleIdentifier == afterEffectsBundleIdentifier ||
            frontmostBundleIdentifier == helperBundleIdentifier
        else {
            return
        }
        let size = NSSize(width: 360, height: 520)
        let point = NSEvent.mouseLocation
        let frame = afterEffectsOverlayFrame(near: point, size: size)
        guard let panel else { return }
        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0
            context.allowsImplicitAnimation = false
            panel.setFrame(frame, display: true, animate: false)
        }
        presentPanelWithoutAnimation(panel)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) { [weak self] in
            self?.webView?.evaluateJavaScript("""
            (async function () {
                window.focus();
                if (window.__tntQuickPanelOpenLayerMenu) await window.__tntQuickPanelOpenLayerMenu();
            }());
            """)
        }
    }

    private func openQuickPanelControl(_ name: String) {
        guard let panel, panel.isVisible else { return }
        presentPanelWithoutAnimation(panel)
        webView?.evaluateJavaScript(
            "if (window.__tntQuickPanelOpenControl) window.__tntQuickPanelOpenControl(\(javaScriptLiteral(name)));"
        )
    }

    func togglePanelFromHotKey() {
        guard afterEffectsApplication() != nil else {
            panel?.orderOut(nil)
            return
        }
        let helperBundleIdentifier = Bundle.main.bundleIdentifier ?? ""
        let frontmostBundleIdentifier = NSWorkspace.shared.frontmostApplication?.bundleIdentifier ?? ""
        guard
            frontmostBundleIdentifier == afterEffectsBundleIdentifier ||
            frontmostBundleIdentifier == helperBundleIdentifier
        else {
            return
        }
        if let panel, panel.isVisible, panel.isKeyWindow {
            panel.orderOut(nil)
        } else {
            showPanel()
        }
    }

    func openPanelControlFromHotKey(_ controlName: String) {
        guard afterEffectsApplication() != nil else {
            panel?.orderOut(nil)
            return
        }
        let helperBundleIdentifier = Bundle.main.bundleIdentifier ?? ""
        let frontmostBundleIdentifier = NSWorkspace.shared.frontmostApplication?.bundleIdentifier ?? ""
        guard
            frontmostBundleIdentifier == afterEffectsBundleIdentifier ||
            frontmostBundleIdentifier == helperBundleIdentifier
        else {
            return
        }
        showPanel(openControl: controlName)
    }

    private func startGlobalShortcutFallbackMonitor() {
        guard accessibilityTrustedNoPrompt() else {
            logAccessibilitySkip("global shortcut fallback")
            return
        }
        globalShortcutMonitor = NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if isQuickPanelSummonShortcut(event) {
                DispatchQueue.main.async {
                    self?.togglePanelFromHotKey()
                }
                return
            }
            guard let controlName = quickPanelControlName(for: event) else { return }
            DispatchQueue.main.async {
                self?.openPanelControlFromHotKey(controlName)
            }
        }
    }

    private func startControlRightClickMonitor() {
        guard rightClickEventTap == nil else { return }
        guard accessibilityTrustedNoPrompt() else {
            logAccessibilitySkip("Control-right-click monitor")
            return
        }
        let mask = CGEventMask(1 << CGEventType.rightMouseDown.rawValue)
        let callback: CGEventTapCallBack = { _, type, event, _ in
            guard type == .rightMouseDown, isControlRightMouseDown(event) else {
                return Unmanaged.passUnretained(event)
            }
            DispatchQueue.main.async {
                activeAppDelegate?.showLayerMenuAtMouseLocation()
            }
            return nil
        }
        guard let tap = CGEvent.tapCreate(
            tap: .cgSessionEventTap,
            place: .headInsertEventTap,
            options: .defaultTap,
            eventsOfInterest: mask,
            callback: callback,
            userInfo: nil
        ) else {
            guard accessibilityTrustedNoPrompt() else {
                logAccessibilitySkip("Control-right-click fallback")
                return
            }
            rightClickFallbackMonitor = NSEvent.addGlobalMonitorForEvents(matching: .rightMouseDown) { event in
                let flags = event.modifierFlags.intersection(.deviceIndependentFlagsMask)
                guard flags.contains(.control),
                      !flags.contains(.command),
                      !flags.contains(.option),
                      !flags.contains(.shift)
                else { return }
                DispatchQueue.main.async {
                    activeAppDelegate?.showLayerMenuAtMouseLocation()
                }
            }
            return
        }
        rightClickEventTap = tap
        rightClickRunLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0)
        if let rightClickRunLoopSource {
            CFRunLoopAddSource(CFRunLoopGetMain(), rightClickRunLoopSource, .commonModes)
        }
        CGEvent.tapEnable(tap: tap, enable: true)
    }

    private func logAccessibilitySkip(_ feature: String) {
        guard !loggedAccessibilitySkip else { return }
        loggedAccessibilitySkip = true
        tntLog("Accessibility is not trusted yet; skipping \(feature) without prompting.")
    }

    // Plain C opens TNK - the binding TNK v3 always used inside After Effects.
    //
    // This cannot go through RegisterEventHotKey like the Ctrl+letter shortcuts:
    // that claims the key for the whole session and would eat the letter "c" in
    // every application, so you could not type it anywhere. A session event tap
    // sees the key first and decides per keystroke, so C is swallowed only while
    // After Effects (or this overlay) is frontmost and passes straight through
    // everywhere else.
    //
    private func stopControlRightClickMonitor() {
        if let rightClickRunLoopSource {
            CFRunLoopRemoveSource(CFRunLoopGetMain(), rightClickRunLoopSource, .commonModes)
            self.rightClickRunLoopSource = nil
        }
        if let rightClickEventTap {
            CFMachPortInvalidate(rightClickEventTap)
            self.rightClickEventTap = nil
        }
        if let rightClickFallbackMonitor {
            NSEvent.removeMonitor(rightClickFallbackMonitor)
            self.rightClickFallbackMonitor = nil
        }
    }

    @discardableResult
    private func registerGlobalHotKeys() -> Bool {
        var eventType = EventTypeSpec(
            eventClass: OSType(kEventClassKeyboard),
            eventKind: UInt32(kEventHotKeyPressed)
        )
        let installStatus = InstallEventHandler(
            GetApplicationEventTarget(),
            { _, event, _ in
                guard let event else { return OSStatus(eventNotHandledErr) }
                var hotKeyId = EventHotKeyID()
                let status = GetEventParameter(
                    event,
                    EventParamName(kEventParamDirectObject),
                    EventParamType(typeEventHotKeyID),
                    nil,
                    MemoryLayout<EventHotKeyID>.size,
                    nil,
                    &hotKeyId
                )
                guard status == noErr, hotKeyId.signature == quickControlsHotKeySignature else {
                    return OSStatus(eventNotHandledErr)
                }
                DispatchQueue.main.async {
                    if let controlName = quickPanelControlName(forHotKeyId: hotKeyId.id) {
                        activeAppDelegate?.openPanelControlFromHotKey(controlName)
                    } else {
                        activeAppDelegate?.togglePanelFromHotKey()
                    }
                }
                return noErr
            },
            1,
            &eventType,
            nil,
            &hotKeyEventHandler
        )
        guard installStatus == noErr else {
            tntLog("FATAL: InstallEventHandler failed with OSStatus \(installStatus); no global hotkey will fire.")
            return false
        }

        let requested: [(keyCode: Int, id: UInt32)] = [
            (kVK_Space, 1), (kVK_ANSI_K, 2),
            (kVK_ANSI_A, 10), (kVK_ANSI_C, 11), (kVK_ANSI_E, 12), (kVK_ANSI_F, 13),
            (kVK_ANSI_S, 14), (kVK_ANSI_M, 15), (kVK_ANSI_T, 16), (kVK_ANSI_O, 17),
            (kVK_ANSI_D, 19)
        ]
        requested.forEach { entry in
            registerHotKey(keyCode: UInt32(entry.keyCode), modifiers: UInt32(controlKey), id: entry.id)
        }
        let registered = hotKeyRefs.count
        if registered == requested.count {
            tntLog("hotkeys: registered all \(registered)")
        } else {
            tntLog("hotkeys: registered \(registered) of \(requested.count) - the rest are taken by another app")
        }
        return registered == requested.count
    }

    private func registerHotKey(keyCode: UInt32, modifiers: UInt32, id: UInt32) {
        var ref: EventHotKeyRef?
        let hotKeyId = EventHotKeyID(signature: quickControlsHotKeySignature, id: id)
        let status = RegisterEventHotKey(
            keyCode,
            modifiers,
            hotKeyId,
            GetApplicationEventTarget(),
            0,
            &ref
        )
        if status == noErr, let ref {
            hotKeyRefs.append(ref)
        } else {
            tntLog("hotkey id \(id) (keyCode \(keyCode)) failed to register: OSStatus \(status)")
        }
    }

    private func unregisterGlobalHotKeys() {
        hotKeyRefs.forEach { UnregisterEventHotKey($0) }
        hotKeyRefs.removeAll()
        if let hotKeyEventHandler {
            RemoveEventHandler(hotKeyEventHandler)
            self.hotKeyEventHandler = nil
        }
    }

    private func restorePanelFocusAfterBridgeExecution() {
        guard let panel, panel.isVisible else { return }
        presentPanelWithoutAnimation(panel)
        webView?.evaluateJavaScript(
            "window.focus(); if (window.__tntQuickPanelRestoreFocus) window.__tntQuickPanelRestoreFocus();"
        )
    }

    private func scheduleDismissAfterResign() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) { [weak self] in
            guard
                let self,
                let panel = self.panel,
                panel.isVisible,
                !panel.isKeyWindow
            else {
                return
            }
            if self.activeBridgeExecutions > 0 {
                self.scheduleDismissAfterResign()
                return
            }
            let remainingGrace = self.bridgeFocusGraceUntil.timeIntervalSinceNow
            if remainingGrace > 0 {
                DispatchQueue.main.asyncAfter(deadline: .now() + remainingGrace + 0.02) { [weak self] in
                    self?.scheduleDismissAfterResign()
                }
                return
            }
            panel.orderOut(nil)
        }
    }

    private func startApplicationVisibilityMonitor() {
        let center = NSWorkspace.shared.notificationCenter
        let activationObserver = center.addObserver(
            forName: NSWorkspace.didActivateApplicationNotification,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard
                let application = notification.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication
            else {
                return
            }
            let helperBundleIdentifier = Bundle.main.bundleIdentifier ?? ""
            if application.bundleIdentifier != afterEffectsBundleIdentifier &&
               application.bundleIdentifier != helperBundleIdentifier {
                self?.panel?.orderOut(nil)
            }
        }
        workspaceObservers.append(activationObserver)

        visibilityTimer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: true) { [weak self] _ in
            guard let self, let panel = self.panel, panel.isVisible else { return }
            let helperBundleIdentifier = Bundle.main.bundleIdentifier ?? ""
            let frontmostBundleIdentifier = NSWorkspace.shared.frontmostApplication?.bundleIdentifier ?? ""
            let allowed = frontmostBundleIdentifier == afterEffectsBundleIdentifier ||
                frontmostBundleIdentifier == helperBundleIdentifier
            if !allowed || afterEffectsWindowFrame() == nil {
                panel.orderOut(nil)
            }
        }
    }

    private func extensionRootURL() -> URL? {
        let appURL = Bundle.main.bundleURL
        let nativeDirectory = appURL.deletingLastPathComponent()
        let extensionRoot = nativeDirectory.deletingLastPathComponent()
        let quickPage = extensionRoot.appendingPathComponent("quick.html")
        return FileManager.default.fileExists(atPath: quickPage.path) ? extensionRoot : nil
    }
}

let application = NSApplication.shared
private let delegate = AppDelegate()
application.delegate = delegate
application.run()


extension AppDelegate: WKUIDelegate {
    func webView(
        _ webView: WKWebView,
        runJavaScriptConfirmPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (Bool) -> Void
    ) {
        let alert = NSAlert()
        alert.messageText = "AE FX Quick Controls"
        alert.informativeText = message
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Continue")
        alert.addButton(withTitle: "Cancel")
        completionHandler(alert.runModal() == .alertFirstButtonReturn)
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptAlertPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping () -> Void
    ) {
        let alert = NSAlert()
        alert.messageText = "AE FX Quick Controls"
        alert.informativeText = message
        alert.addButton(withTitle: "OK")
        alert.runModal()
        completionHandler()
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptTextInputPanelWithPrompt prompt: String,
        defaultText: String?,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (String?) -> Void
    ) {
        let alert = NSAlert()
        alert.messageText = "AE FX Quick Controls"
        alert.informativeText = prompt
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Cancel")
        let field = NSTextField(frame: NSRect(x: 0, y: 0, width: 260, height: 24))
        field.stringValue = defaultText ?? ""
        alert.accessoryView = field
        completionHandler(alert.runModal() == .alertFirstButtonReturn ? field.stringValue : nil)
    }
}
