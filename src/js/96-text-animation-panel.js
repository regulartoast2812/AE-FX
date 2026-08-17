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
      <header class="text-animation-head">
        <div class="text-animation-title"><b>TA</b><span>Text Animation</span><em class="text-animation-count">0 text</em></div>
        <button type="button" class="text-animation-close" aria-label="Close">x</button>
      </header>
      <div class="text-animation-body">
        <section class="text-animation-section">
          <div class="text-animation-section-head">
            <strong>Content</strong>
            <span>Selected text layers or wider text scopes</span>
          </div>
          <div class="text-animation-command-row">
            <button type="button" data-text-command="set" data-tooltip="Set Text Content\nReplace the text on the first or all selected text layers."><strong>Set Text</strong><span>First or all selected</span></button>
            <button type="button" data-text-command="replace" data-tooltip="Find / Replace Text\nSearch selected text, the active comp, or the whole project."><strong>Find / Replace</strong><span>Selected, comp, project</span></button>
          </div>
        </section>

        <section class="text-animation-section text-animation-builder">
          <div class="text-animation-section-head">
            <strong>Animator Builder</strong>
            <span>Applies to selected text layers</span>
          </div>
          <div class="text-animation-grid">
            <label class="text-animation-field">
              <span>Style</span>
              <div class="text-animation-segmented" data-text-option-group="style">
                <button type="button" data-text-option="style" data-value="master">Master</button>
                <button type="button" data-text-option="style" data-value="bounce">Bounce</button>
              </div>
            </label>
            <label class="text-animation-field">
              <span>Mode</span>
              <div class="text-animation-segmented" data-text-option-group="mode">
                <button type="button" data-text-option="mode" data-value="in">In</button>
                <button type="button" data-text-option="mode" data-value="out">Out</button>
                <button type="button" data-text-option="mode" data-value="both">Both</button>
              </div>
            </label>
            <label class="text-animation-field">
              <span>Direction</span>
              <div class="text-animation-segmented direction" data-text-option-group="direction">
                <button type="button" data-text-option="direction" data-value="up">Up</button>
                <button type="button" data-text-option="direction" data-value="down">Down</button>
                <button type="button" data-text-option="direction" data-value="left">Left</button>
                <button type="button" data-text-option="direction" data-value="right">Right</button>
              </div>
            </label>
            <label class="text-animation-field">
              <span>Based on</span>
              <div class="text-animation-segmented based-on" data-text-option-group="basedOn">
                <button type="button" data-text-option="basedOn" data-value="1">Chars</button>
                <button type="button" data-text-option="basedOn" data-value="3">Words</button>
                <button type="button" data-text-option="basedOn" data-value="4">Lines</button>
              </div>
            </label>
            <div class="text-animation-field">
              <span>Properties</span>
              <div class="text-animation-checks">
                <label><input type="checkbox" data-text-toggle="usePosition"> Position</label>
                <label><input type="checkbox" data-text-toggle="useOpacity"> Opacity</label>
                <label><input type="checkbox" data-text-toggle="useScale"> Scale</label>
              </div>
            </div>
            <div class="text-animation-field">
              <span>Timing</span>
              <div class="text-animation-times">
                <label><span>In</span><input type="number" min="0" step="0.05" data-text-number="inTime"></label>
                <label><span>Out</span><input type="number" min="0" step="0.05" data-text-number="outTime"></label>
              </div>
            </div>
          </div>
          <button type="button" class="text-animation-apply" data-text-apply="builder" data-tooltip="Apply Text Animator\nBuild text animators using the selected style, mode, direction, grouping, properties, and timing.">Apply Animator</button>
        </section>

        <section class="text-animation-section">
          <div class="text-animation-section-head">
            <strong>Presets</strong>
            <span>Fast common text animator setups</span>
          </div>
          <div class="text-animation-preset-grid">
            <button type="button" data-text-preset="master-in-up"><strong>In Up</strong><span>Position + opacity</span></button>
            <button type="button" data-text-preset="master-out-up"><strong>Out Up</strong><span>Position + opacity</span></button>
            <button type="button" data-text-preset="master-both-up"><strong>In + Out Up</strong><span>Balanced default</span></button>
            <button type="button" data-text-preset="master-both-left"><strong>In + Out Left</strong><span>Side reveal</span></button>
            <button type="button" data-text-preset="master-scale-both"><strong>Scale Pop</strong><span>Scale + opacity</span></button>
            <button type="button" data-text-preset="bounce-in-up"><strong>Bounce In</strong><span>Upward bounce</span></button>
          </div>
        </section>
      </div>
      <div class="text-animation-error"></div>
    </div>
  `;
  document.body.appendChild(textAnimationBackdropEl);
  textAnimationBackdropEl.querySelectorAll("[data-tooltip]").forEach(bindPanelTooltip);
  textAnimationBackdropEl.querySelector(".text-animation-close").addEventListener("click", hideTextAnimationPanel);
  textAnimationBackdropEl.addEventListener("mousedown", event => {
    if (event.target === textAnimationBackdropEl) hideTextAnimationPanel();
  });
  textAnimationBackdropEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      hideTextAnimationPanel();
      focusPanel(2);
    }
  });
  textAnimationBackdropEl.addEventListener("click", event => {
    const option = event.target.closest && event.target.closest("[data-text-option]");
    if (option) {
      const key = option.dataset.textOption;
      textAnimationState[key] = key === "basedOn" ? Number(option.dataset.value || 3) : option.dataset.value;
      renderTextAnimationPanel();
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
    const toggle = event.target.closest && event.target.closest("[data-text-toggle]");
    if (toggle) {
      textAnimationState[toggle.dataset.textToggle] = !!toggle.checked;
      renderTextAnimationPanel();
      return;
    }
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
    button.classList.toggle("active", String(textAnimationState[key]) === String(button.dataset.value));
  });
  textAnimationBackdropEl.querySelectorAll("[data-text-toggle]").forEach(input => {
    input.checked = !!textAnimationState[input.dataset.textToggle];
  });
  textAnimationBackdropEl.querySelectorAll("[data-text-number]").forEach(input => {
    input.value = String(textAnimationState[input.dataset.textNumber]);
  });
  const apply = textAnimationBackdropEl.querySelector("[data-text-apply]");
  if (apply) apply.disabled = count < 1;
  textAnimationBackdropEl.querySelectorAll("[data-text-preset]").forEach(button => {
    button.disabled = count < 1;
  });
  const error = textAnimationBackdropEl.querySelector(".text-animation-error");
  if (error) error.textContent = count < 1 ? "Select at least one text layer to apply text animation." : "";
}

function showTextAnimationPanel() {
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
