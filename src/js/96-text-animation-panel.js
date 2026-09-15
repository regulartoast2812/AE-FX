let textAnimationBackdropEl = null;
let textAnimationState = {
  style: "master",
  mode: "both",
  direction: "up",
  basedOn: 3,
  usePosition: true,
  useOpacity: true,
  useScale: false,
  inTime: 0.35,
  outTime: 0.35
};

function ensureTextAnimationPanel() {
  if (textAnimationBackdropEl) return textAnimationBackdropEl;
  textAnimationBackdropEl = document.createElement("div");
  textAnimationBackdropEl.className = "text-animation-backdrop";
  textAnimationBackdropEl.setAttribute("aria-hidden", "true");
  textAnimationBackdropEl.innerHTML = `
    <div class="text-animation-dialog" role="dialog" aria-modal="true" aria-label="Text animation">
      <header class="text-animation-head layout-panel-head">
        <span class="layout-panel-name">Text</span><em class="text-animation-count layout-panel-count">0 text</em><em class="tnt-selection-readout" data-tnt-selection hidden></em>
        <button type="button" class="text-animation-close" aria-label="Close" data-tooltip="Close\nClose the text tools.">${tntIconSvg("ui.close")}</button>
      </header>
      <div class="text-animation-body">
        <section class="text-animation-section">
          <div class="text-animation-section-head">
            <strong>Functions</strong>
          </div>
          <div class="text-animation-command-row">
            <button type="button" data-text-command="set" aria-label="Set text" data-tooltip="Set Text Content\nReplace the text on the first or all selected text layers.">${tntIconSvg("type")}</button>
            <button type="button" data-text-command="replace" aria-label="Find and replace" data-tooltip="Find / Replace Text\nSearch selected text, the active comp, or the whole project.">${tntIconSvg("replace")}</button>
          </div>
        </section>

        <section class="text-animation-section text-animation-builder">
          <div class="text-animation-section-head text-animation-builder-head">
            <strong>Animation</strong>
          </div>
          <div class="text-animation-grid">
            <label class="text-animation-field">
              <span>Style:</span>
              <div class="text-animation-segmented" data-text-option-group="style">
                <button type="button" data-text-option="style" data-value="master">Master</button>
                <button type="button" data-text-option="style" data-value="bounce">Bounce</button>
              </div>
            </label>
            <label class="text-animation-field">
              <span>Apply:</span>
              <div class="text-animation-segmented" data-text-option-group="mode">
                <button type="button" data-text-option="mode" data-value="in" aria-label="Apply animate in" data-tooltip="Apply In\nBuild the entrance animation from the settings above. The highlight shows the last mode applied.">${tntIconSvg("log-in")}</button>
                <button type="button" data-text-option="mode" data-value="out" aria-label="Apply animate out" data-tooltip="Apply Out\nBuild the exit animation from the settings above.">${tntIconSvg("log-out")}</button>
                <button type="button" data-text-option="mode" data-value="both" aria-label="Apply animate in and out" data-tooltip="Apply In and Out\nBuild both the entrance and the exit from the settings above.">${tntIconSvg("arrow-left-right")}</button>
              </div>
            </label>
            <label class="text-animation-field">
              <span>Move:</span>
              <div class="text-animation-segmented direction" data-text-option-group="direction">
                <button type="button" data-text-option="direction" data-value="up" aria-label="Up" title="Up">${tntIconSvg("arrow-up")}</button>
                <button type="button" data-text-option="direction" data-value="down" aria-label="Down" title="Down">${tntIconSvg("arrow-down")}</button>
                <button type="button" data-text-option="direction" data-value="left" aria-label="Left" title="Left">${tntIconSvg("arrow-left")}</button>
                <button type="button" data-text-option="direction" data-value="right" aria-label="Right" title="Right">${tntIconSvg("arrow-right")}</button>
              </div>
            </label>
            <label class="text-animation-field">
              <span>By:</span>
              <div class="text-animation-segmented based-on" data-text-option-group="basedOn">
                <button type="button" data-text-option="basedOn" data-value="1" aria-label="By characters" data-tooltip="By Characters\nStagger the animation one character at a time.">${tntIconSvg("case-sensitive")}</button>
                <button type="button" data-text-option="basedOn" data-value="3" aria-label="By words" data-tooltip="By Words\nStagger the animation one word at a time.">${tntIconSvg("whole-word")}</button>
                <button type="button" data-text-option="basedOn" data-value="4" aria-label="By lines" data-tooltip="By Lines\nStagger the animation one line at a time.">${tntIconSvg("wrap-text")}</button>
              </div>
            </label>
            <div class="text-animation-field text-animation-properties">
              <span>Animate:</span>
              <div class="text-animation-checks">
                <button type="button" data-text-toggle="usePosition" aria-label="Animate position" aria-pressed="false" data-tooltip="Position\nInclude movement in the text animation.">${tntIconSvg("move")}</button>
                <button type="button" data-text-toggle="useOpacity" aria-label="Animate opacity" aria-pressed="false" data-tooltip="Opacity\nInclude fading in the text animation.">${tntIconSvg("blend")}</button>
                <button type="button" data-text-toggle="useScale" aria-label="Animate scale" aria-pressed="false" data-tooltip="Scale\nInclude scaling in the text animation.">${tntIconSvg("scaling")}</button>
              </div>
            </div>
            <div class="text-animation-field text-animation-duration">
              <span>Seconds:</span>
              <div class="text-animation-times">
                <label><span>In</span><input type="number" min="0" step="0.05" data-text-number="inTime"></label>
                <label><span>Out</span><input type="number" min="0" step="0.05" data-text-number="outTime"></label>
              </div>
            </div>
          </div>
          <div class="text-animation-presets">
          <div class="text-animation-section-head">
            <strong>Presets</strong>
          </div>
          <div class="text-animation-preset-grid">
            <button type="button" data-text-preset="master-in-up"><strong>In</strong><span>In Up: position + opacity</span></button>
            <button type="button" data-text-preset="master-out-up"><strong>Out</strong><span>Out Up: position + opacity</span></button>
            <button type="button" data-text-preset="master-both-up"><strong>In + Out</strong><span>In + Out Up: balanced default</span></button>
            <button type="button" data-text-preset="master-both-left"><strong>Slide</strong><span>In + Out Left: side reveal</span></button>
            <button type="button" data-text-preset="master-scale-both"><strong>Pop</strong><span>Scale Pop: scale + opacity</span></button>
            <button type="button" data-text-preset="bounce-in-up"><strong>Bounce</strong><span>Bounce In: upward bounce</span></button>
          </div>
          </div>
          <div class="text-animation-error"></div>
        </section>
      </div>
    </div>
  `;
  document.body.appendChild(textAnimationBackdropEl);
  textAnimationBackdropEl.querySelectorAll("[data-text-option='direction']").forEach(button => {
    button.setAttribute("data-tooltip", `${button.title}\nSet the text animator direction.`);
  });
  textAnimationBackdropEl.querySelectorAll("[data-text-preset]").forEach(button => {
    button.setAttribute("data-tooltip", `${button.querySelector("strong").textContent}\n${button.querySelector("span").textContent}`);
  });
  textAnimationBackdropEl.querySelectorAll("[data-tooltip]").forEach(bindPanelTooltip);
  textAnimationBackdropEl.querySelector(".text-animation-close").addEventListener("click", hideTextAnimationPanel);
  textAnimationBackdropEl.addEventListener("mousedown", event => {
    if (event.target === textAnimationBackdropEl) hideTextAnimationPanel();
  });
  textAnimationBackdropEl.addEventListener("keydown", event => {
    const toggle = event.target.closest && event.target.closest("[data-text-toggle]");
    if (toggle && (event.key === " " || event.key === "Enter")) {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) toggle.click();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      hideTextAnimationPanel();
      focusPanel(2);
    }
  });
  textAnimationBackdropEl.addEventListener("click", event => {
    const toggle = event.target.closest && event.target.closest("[data-text-toggle]");
    if (toggle) {
      textAnimationState[toggle.dataset.textToggle] = !textAnimationState[toggle.dataset.textToggle];
      renderTextAnimationPanel();
      return;
    }
    const option = event.target.closest && event.target.closest("[data-text-option]");
    if (option) {
      if (option.disabled) return;
      const key = option.dataset.textOption;
      textAnimationState[key] = key === "basedOn" ? Number(option.dataset.value || 3) : option.dataset.value;
      renderTextAnimationPanel();
      // Mode is the apply. The separate Apply bar restated a choice the editor
      // had already made one row above, so picking In, Out or In + Out builds
      // straight away using everything set above it.
      if (key === "mode") applyTextAnimationBuilder();
      return;
    }
    const command = event.target.closest && event.target.closest("[data-text-command]");
    if (command) {
      runTextAnimationCommand(command.dataset.textCommand);
      return;
    }
    const preset = event.target.closest && event.target.closest("[data-text-preset]");
    if (preset) {
      applyTextAnimationPreset(preset.dataset.textPreset);
      return;
    }
    const apply = event.target.closest && event.target.closest("[data-text-apply]");
    if (apply) applyTextAnimationBuilder();
  });
  textAnimationBackdropEl.addEventListener("change", event => {
    const number = event.target.closest && event.target.closest("[data-text-number]");
    if (number) {
      textAnimationState[number.dataset.textNumber] = Math.max(0, Number(number.value || 0));
      renderTextAnimationPanel();
    }
  });
  return textAnimationBackdropEl;
}

function textAnimationSelectedTextCount() {
  const selected = new Set((state.selectedLayerIndices || []).map(Number));
  return (state.layers || []).filter(layer => selected.has(Number(layer.index)) && layer.type === "Text").length;
}

function renderTextAnimationPanel() {
  if (!textAnimationBackdropEl) return;
  const count = textAnimationSelectedTextCount();
  const countEl = textAnimationBackdropEl.querySelector(".text-animation-count");
  if (countEl) countEl.textContent = `${count} text layer${count === 1 ? "" : "s"}`;
  textAnimationBackdropEl.querySelectorAll("[data-text-option]").forEach(button => {
    const key = button.dataset.textOption;
    const active = String(textAnimationState[key]) === String(button.dataset.value);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  textAnimationBackdropEl.querySelectorAll("[data-text-toggle]").forEach(button => {
    const active = !!textAnimationState[button.dataset.textToggle];
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  textAnimationBackdropEl.querySelectorAll("[data-text-number]").forEach(input => {
    input.value = String(textAnimationState[input.dataset.textNumber]);
  });
  // Mode runs the build, so it is the control that needs a text layer. The
  // other option rows are plain choices and stay usable.
  textAnimationBackdropEl.querySelectorAll('[data-text-option="mode"]').forEach(button => {
    button.disabled = count < 1;
  });
  textAnimationBackdropEl.querySelectorAll("[data-text-preset]").forEach(button => {
    button.disabled = count < 1;
  });
  const error = textAnimationBackdropEl.querySelector(".text-animation-error");
  if (error) error.textContent = count < 1 ? "Select at least one text layer to apply text animation." : "";
}

function showTextAnimationPanel() {
  if (typeof tntPaintSelectionReadouts === "function") setTimeout(() => tntPaintSelectionReadouts(document), 0);
  const el = ensureTextAnimationPanel();
  if (el.classList.contains("show")) {
    hideTextAnimationPanel();
    return;
  }
  renderTextAnimationPanel();
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  refreshSyncPausedVisualState();
}

function hideTextAnimationPanel() {
  if (!textAnimationBackdropEl) return;
  textAnimationBackdropEl.classList.remove("show");
  textAnimationBackdropEl.setAttribute("aria-hidden", "true");
  refreshSyncPausedVisualState();
}

async function runTextAnimationCommand(command) {
  if (command === "set") await promptSetTextContent();
  else if (command === "replace") await promptFindReplaceText();
  renderTextAnimationPanel();
}

function textAnimationArgsFromState() {
  return [
    textAnimationState.direction,
    Number(textAnimationState.basedOn || 3),
    !!textAnimationState.usePosition,
    !!textAnimationState.useOpacity,
    !!textAnimationState.useScale,
    Number(textAnimationState.inTime || 0),
    Number(textAnimationState.outTime || 0),
    textAnimationState.mode
  ];
}

async function applyTextAnimationBuilder() {
  if (textAnimationSelectedTextCount() < 1) {
    renderTextAnimationPanel();
    return;
  }
  const fn = textAnimationState.style === "bounce" ? "applyTextAnimBounce" : "applyTextAnimMaster";
  await runTntV3Command({ name: "Text Animation", tntFunction: fn, args: textAnimationArgsFromState() });
  renderTextAnimationPanel();
}

async function applyTextAnimationPreset(name) {
  const presets = {
    "master-in-up": ["applyTextAnimMaster", ["up", 3, true, true, false, 0.35, 0.35, "in"]],
    "master-out-up": ["applyTextAnimMaster", ["up", 3, true, true, false, 0.35, 0.35, "out"]],
    "master-both-up": ["applyTextAnimMaster", ["up", 3, true, true, false, 0.35, 0.35, "both"]],
    "master-both-left": ["applyTextAnimMaster", ["left", 3, true, true, false, 0.35, 0.35, "both"]],
    "master-scale-both": ["applyTextAnimMaster", ["up", 3, false, true, true, 0.35, 0.35, "both"]],
    "bounce-in-up": ["applyTextAnimBounce", ["up", 3, true, true, false, 0.35, 0.35, "in"]]
  };
  const preset = presets[name];
  if (!preset) return;
  await runTntV3Command({ name: "Text Animation Preset", tntFunction: preset[0], args: preset[1] });
  renderTextAnimationPanel();
}
