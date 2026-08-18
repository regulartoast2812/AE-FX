import Cocoa
import Carbon
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
    case 18: return "filter"
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
    case "x": return "filter"
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

private func terminateDuplicateQuickControlsInstances() {
    guard let bundleIdentifier = Bundle.main.bundleIdentifier else { return }
    let currentPID = ProcessInfo.processInfo.processIdentifier
    NSRunningApplication.runningApplications(withBundleIdentifier: bundleIdentifier).forEach { application in
        guard application.processIdentifier != currentPID else { return }
        application.terminate()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            if !application.isTerminated {
                application.forceTerminate()
            }
        }
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

private final class AfterEffectsBridge: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?
    var onExecutionStarted: (() -> Void)?
    var onExecutionFinished: (() -> Void)?
    private let executionQueue = DispatchQueue(label: "com.tnt.ae.quickcontrols.jsx", qos: .userInitiated)

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
        panel.setFrame(frame, display: true, animate: false)
        // Reveal once sizes settle, not on the first one.
        activeAppDelegate?.scheduleReveal(after: 0.07)
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

    func applicationDidFinishLaunching(_ notification: Notification) {
        terminateDuplicateQuickControlsInstances()
        activeAppDelegate = self
        guard let extensionRoot = extensionRootURL() else {
            NSApp.terminate(nil)
            return
        }

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
        let carbonHotKeysReady = registerGlobalHotKeys()
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
    func scheduleReveal(after delay: TimeInterval) {
        guard let panel, panel.alphaValue < 1 else { return }
        pendingRevealWorkItem?.cancel()
        let work = DispatchWorkItem { [weak self] in
            self?.pendingRevealWorkItem = nil
            guard let panel = self?.panel, panel.alphaValue < 1 else { return }
            panel.alphaValue = 1
        }
        pendingRevealWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: work)
    }

    private func showPanel(openControl controlName: String? = nil) {
        guard let panel, let frame = afterEffectsOverlayFrame(for: quickControlsLauncherSize) else {
            panel?.orderOut(nil)
            return
        }
        // Opening straight into a subpanel means the window is ordered front at the
        // launcher size, then resized (and recentred) once the page measures its
        // content. Showing both states is the multiple blink. Order it front fully
        // transparent instead and reveal it on the first resize.
        let deferReveal = controlName != nil && !panel.isVisible
        pendingRevealWorkItem?.cancel()
        pendingRevealWorkItem = nil
        panel.alphaValue = deferReveal ? 0 : 1

        panel.setFrame(frame, display: true, animate: false)
        NSApp.unhide(nil)
        NSApp.activate(ignoringOtherApps: true)
        panel.makeKeyAndOrderFront(nil)
        panel.orderFrontRegardless()

        if deferReveal {
            // Safety net: reveal anyway if the page never reports a size.
            scheduleReveal(after: 0.45)
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) { [weak self] in
            let showScript: String
            if let controlName {
                showScript = "if (window.__tntQuickPanelOpenControl) await window.__tntQuickPanelOpenControl(\(javaScriptLiteral(controlName)));"
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
        panel.setFrame(frame, display: true, animate: false)
        NSApp.unhide(nil)
        NSApp.activate(ignoringOtherApps: true)
        panel.makeKeyAndOrderFront(nil)
        panel.orderFrontRegardless()
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
        NSApp.unhide(nil)
        NSApp.activate(ignoringOtherApps: true)
        panel.makeKeyAndOrderFront(nil)
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
        guard installStatus == noErr else { return false }

        let requested: [(keyCode: Int, id: UInt32)] = [
            (kVK_Space, 1), (kVK_ANSI_K, 2),
            (kVK_ANSI_A, 10), (kVK_ANSI_C, 11), (kVK_ANSI_E, 12), (kVK_ANSI_F, 13),
            (kVK_ANSI_S, 14), (kVK_ANSI_M, 15), (kVK_ANSI_T, 16), (kVK_ANSI_O, 17),
            (kVK_ANSI_X, 18)
        ]
        requested.forEach { entry in
            registerHotKey(keyCode: UInt32(entry.keyCode), modifiers: UInt32(controlKey), id: entry.id)
        }
        return hotKeyRefs.count == requested.count
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
        NSApp.unhide(nil)
        NSApp.activate(ignoringOtherApps: true)
        panel.makeKeyAndOrderFront(nil)
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
        alert.messageText = "TNT Quick Controls"
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
        alert.messageText = "TNT Quick Controls"
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
        alert.messageText = "TNT Quick Controls"
        alert.informativeText = prompt
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Cancel")
        let field = NSTextField(frame: NSRect(x: 0, y: 0, width: 260, height: 24))
        field.stringValue = defaultText ?? ""
        alert.accessoryView = field
        completionHandler(alert.runModal() == .alertFirstButtonReturn ? field.stringValue : nil)
    }
}
