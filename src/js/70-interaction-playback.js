function timeFromPointerEvent(event, options = {}) {
  if (!state.comp) return 0;

  // Use the scroll container viewport as the coordinate origin.
  // Do NOT use rulerWrapEl.getBoundingClientRect() here: the ruler is a wide
  // sticky/scrolling element, so its left edge changes as you scroll. Adding
  // scrollLeft on top of that made scrubbing become "relative" near the ends.
  const viewportRect = scrollAreaEl.getBoundingClientRect();
  const contentX = event.clientX - viewportRect.left + scrollAreaEl.scrollLeft;
  const time = visibleStart + (contentX - currentLeftGutter()) / pixelsPerSecond;
  const minTime = visibleStart;
  const maxTime = Math.min(state.comp.duration, visibleStart + visibleDuration);
  const clamped = Math.max(minTime, Math.min(maxTime, time));
  const snapped = snapTimeToTargets(clamped, {
    targetSnap: options.targetSnap !== false && event.shiftKey,
    minTime,
    maxTime
  });

  if (options.showGuide !== false) showSnapGuide(snapped.time, event.shiftKey, snapped.target);
  return Math.max(minTime, Math.min(maxTime, snapped.time));
}

function normalizeDroppedPath(path) {
  let value = String(path || "").trim();
  if (!value) return "";
  value = value.replace(/^file:\/\/localhost/i, "file://");
  value = value.replace(/^file:\/+/i, match => match.length > 7 ? "/" : "");
  try { value = decodeURIComponent(value); } catch (_) {}
  if (/^\/[A-Za-z]:\//.test(value)) value = value.slice(1);
  if (/^[A-Za-z]:[\\/]/.test(value)) return value.replace(/\//g, "\\");
  if (value.charAt(0) === "/") return value.replace(/\\/g, "/");
  return isMacPlatform() ? value.replace(/\\/g, "/") : value.replace(/\//g, "\\");
}

function droppedFilePaths(event) {
  const transfer = event.dataTransfer;
  const paths = [];
  if (!transfer) return paths;

  try {
    Array.prototype.forEach.call(transfer.files || [], file => {
      const path = file && (file.path || file.name);
      if (path) paths.push(normalizeDroppedPath(path));
    });
  } catch (_) {}

  try {
    Array.prototype.forEach.call(transfer.types || [], type => {
      const data = transfer.getData(type);
      if (!data) return;
      String(data).split(/\r?\n/).forEach(line => {
        const path = normalizeDroppedPath(line);
        if (path && (path.charAt(0) === "/" || path.indexOf("\\") >= 0 || /^[A-Za-z]:/.test(path))) paths.push(path);
      });
    });
  } catch (_) {}

  const seen = {};
  return paths.filter(path => {
    const key = String(path || "").toLowerCase();
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function setTimelineDropActive(active) {
  if (!scrollAreaEl) return;
  document.body.classList.toggle("timeline-drop-active", !!active);
  scrollAreaEl.classList.toggle("drop-active", !!active);
  if (!active) hideDropInsertGuide();
}

function ensureDropInsertGuide() {
  if (dropInsertGuideEl) return dropInsertGuideEl;
  dropInsertGuideEl = document.createElement("div");
  dropInsertGuideEl.className = "drop-insert-guide";
  dropInsertGuideEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(dropInsertGuideEl);
  return dropInsertGuideEl;
}

function dropPlacementFromPointer(event) {
  if (!state.comp) return { beforeIndex: 1, afterIndex: 0, y: 28 };
  const tracks = Array.prototype.slice.call(timelineEl.querySelectorAll(".track[data-drop-before-index]"));
  if (!tracks.length) return { beforeIndex: 1, afterIndex: 0, y: Math.max(28, event.clientY || 28) };

  const y = Number(event.clientY || 0);
  for (let i = 0; i < tracks.length; i++) {
    const rect = tracks[i].getBoundingClientRect();
    const boundary = rect.top + rect.height / 2;
    if (y < boundary) {
      return {
        beforeIndex: Number(tracks[i].dataset.dropBeforeIndex || 1),
        afterIndex: 0,
        y: rect.top
      };
    }
  }

  const lastRect = tracks[tracks.length - 1].getBoundingClientRect();
  return {
    beforeIndex: 0,
    afterIndex: Number(state.comp.numLayers || (state.layers || []).length || tracks[tracks.length - 1].dataset.dropAfterIndex || 0),
    y: lastRect.bottom
  };
}

function showDropInsertGuide(event) {
  if (!state.comp || timelineMode !== "edit") {
    hideDropInsertGuide();
    return;
  }
  const placement = dropPlacementFromPointer(event);
  const guide = ensureDropInsertGuide();
  const panelRect = document.body.getBoundingClientRect();
  guide.style.left = "0px";
  guide.style.right = "0px";
  guide.style.top = `${Math.max(28, Math.min(window.innerHeight - 2, placement.y - panelRect.top))}px`;
  guide.classList.add("show");
}

function hideDropInsertGuide() {
  if (dropInsertGuideEl) dropInsertGuideEl.classList.remove("show");
}

async function importDroppedItems(event) {
  if (!state.comp) {
    statusEl.textContent = "Open a comp before importing.";
    return;
  }
  const paths = droppedFilePaths(event);
  const time = snapTimeToFrame(timeFromPointerEvent(event, { targetSnap: false, showGuide: false }));
  const placement = timelineMode === "edit" ? dropPlacementFromPointer(event) : { beforeIndex: 0, afterIndex: 0 };
  suppressSyncUntil = Date.now() + 1500;
  await loadJSX();
  const result = await aeCall("TNT_importDroppedItems", [paths, time, placement.beforeIndex || 0, placement.afterIndex || 0]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not import dropped items.";
    return;
  }
  const imported = Number(result.importedCount || 0);
  const reused = Number(result.reusedCount || 0);
  const added = Number(result.addedCount || 0);
  statusEl.textContent = imported
    ? `Imported ${imported} file${imported === 1 ? "" : "s"} and added ${added} layer${added === 1 ? "" : "s"}.`
    : reused
      ? `Reused ${reused} Project item${reused === 1 ? "" : "s"} and added ${added} layer${added === 1 ? "" : "s"}.`
      : `Added ${added} Project item${added === 1 ? "" : "s"} as layer${added === 1 ? "" : "s"}.`;
  await refreshLayers({ forceRender: true });
}

async function setTimeFromPointer(event) {
  if (!state.comp) return;
  const time = timeFromPointerEvent(event);
  await setCompTime(time);
}


function previewCompTime(time) {
  if (!state.comp) return;
  const clamped = snapTimeToFrame(Math.max(0, Math.min(state.comp.duration || time, Number(time || 0))));
  state.comp.time = clamped;
  if (timeDisplayEl && !isTimeDisplayEditing) timeDisplayEl.textContent = formatTime(clamped);
  updatePlayhead({ fast: true });
}

async function commitPreviewCompTime(time) {
  if (!state.comp) return;
  suppressSyncUntil = Date.now() + 700;
  await setCompTime(time);
  await syncTick();
}

async function setCompTime(time) {
  await loadJSX();
  const result = await aeCall("TNT_setTime", [snapTimeToFrame(time)]);
  if (result.ok) {
    state.comp.time = result.time;
    updateStatus();
    updatePlayhead();
  }
}

function timeFromDragDelta(startTime, deltaX) {
  if (!state.comp) return 0;
  const raw = Number(startTime || 0) + Number(deltaX || 0) / Math.max(1, pixelsPerSecond);
  return snapTimeToFrame(Math.max(0, Math.min(state.comp.duration || raw, raw)));
}

function beginTimeDisplayInteraction(event) {
  if (!state.comp || event.button !== 0 || isTimeDisplayEditing) return;
  event.preventDefault();
  event.stopPropagation();
  if (isPlaying) stopPlayback(false);
  const startX = event.clientX;
  const startTime = Number(state.comp.time || 0);
  let moved = false;
  let pendingTime = startTime;

  const onMove = moveEvent => {
    moveEvent.preventDefault();
    const dx = moveEvent.clientX - startX;
    if (!moved && Math.abs(dx) < 3) return;
    moved = true;
    isScrubbing = true;
    document.body.classList.add("playhead-scrubbing");
    suppressSyncUntil = Date.now() + 60000;
    pendingTime = timeFromDragDelta(startTime, dx);
    previewCompTime(pendingTime);
  };

  const onUp = async upEvent => {
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("mouseup", onUp, true);
    if (!moved) {
      openTimeDisplayEditor();
      return;
    }
    if (upEvent) pendingTime = timeFromDragDelta(startTime, upEvent.clientX - startX);
    isScrubbing = false;
    document.body.classList.remove("playhead-scrubbing");
    await commitPreviewCompTime(pendingTime);
    focusPanel(2);
  };

  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("mouseup", onUp, true);
}

function openTimeDisplayEditor() {
  if (!state.comp || !timeDisplayEl || isTimeDisplayEditing) return;
  isTimeDisplayEditing = true;
  const originalTime = Number(state.comp.time || 0);
  timeDisplayEl.classList.add("editing");
  timeDisplayEl.innerHTML = `<input id="timeDisplayInput" class="time-display-input" type="text" spellcheck="false">`;
  const input = timeDisplayEl.querySelector("#timeDisplayInput");
  input.value = formatTime(originalTime);

  let closed = false;
  const close = async (apply) => {
    if (closed) return;
    closed = true;
    const nextTime = apply ? parseDurationInput(input.value) : originalTime;
    isTimeDisplayEditing = false;
    timeDisplayEl.classList.remove("editing");
    timeDisplayEl.innerHTML = "";
    if (apply && typeof nextTime === "number" && Number.isFinite(nextTime)) {
      await setCompTime(Math.max(0, Math.min(state.comp.duration || nextTime, nextTime)));
    } else {
      updateStatus();
    }
    focusPanel(2);
  };

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(false);
    }
  });
  input.addEventListener("blur", () => close(true));
  setTimeout(() => {
    input.focus();
    input.select();
  }, 0);
}

function beginMiddleScrub(event) {
  if (!state.comp || event.button !== 1) return;
  event.preventDefault();
  event.stopPropagation();
  if (isPlaying) stopPlayback(false);
  beginPlayheadPreviewDrag(event, { liveAeUpdate: true });
}

function beginScrub(event) {
  if (!state.comp) return;
  if (event.button !== 0 && event.button !== 1) return;
  event.preventDefault();
  event.stopPropagation();
  if (isPlaying) stopPlayback(false);
  beginPlayheadPreviewDrag(event, { liveAeUpdate: true });
}

function beginPlayheadPreviewDrag(event, options = {}) {
  isScrubbing = true;
  document.body.classList.add("playhead-scrubbing");
  suppressSyncUntil = Date.now() + 60000;

  const fps = state.comp ? state.comp.frameRate || 24 : 24;
  // Live AE scrubbing is intentionally capped to half frame-rate so dragging feels alive
  // without bringing back the heavy per-mousemove lag/loading cursor.
  const liveInterval = Math.max(42, Math.round(2000 / fps));
  const liveAeUpdate = options.liveAeUpdate !== false;

  let pendingTime = timeFromPointerEvent(event);
  let lastSentTime = pendingTime;
  let lastLiveSend = 0;
  let liveSendInFlight = false;
  let raf = 0;

  const sendLiveTimeToAe = async (time, force = false) => {
    if (!liveAeUpdate || liveSendInFlight) return;
    const now = performance.now();
    if (!force && now - lastLiveSend < liveInterval) return;
    lastLiveSend = now;
    lastSentTime = time;
    liveSendInFlight = true;
    try {
      await loadJSX();
      const result = await aeCall("TNT_setTime", [time]);
      if (result.ok && state.comp) {
        // Keep local state in sync, but do not full-render while dragging.
        state.comp.time = result.time;
        if (timeDisplayEl && !isTimeDisplayEditing) timeDisplayEl.textContent = formatTime(result.time);
        updatePlayhead({ fast: true });
      }
    } finally {
      liveSendInFlight = false;
    }
  };

  const flushPreview = () => {
    raf = 0;
    previewCompTime(pendingTime);
    sendLiveTimeToAe(pendingTime, false);
  };
  const requestPreview = (moveEvent) => {
    pendingTime = timeFromPointerEvent(moveEvent);
    if (!raf) raf = requestAnimationFrame(flushPreview);
  };

  previewCompTime(pendingTime);
  sendLiveTimeToAe(pendingTime, true);

  const onMove = (moveEvent) => {
    if (!isScrubbing) return;
    moveEvent.preventDefault();
    requestPreview(moveEvent);
  };
  const onUp = async (upEvent) => {
    if (upEvent) pendingTime = timeFromPointerEvent(upEvent);
    isScrubbing = false;
    if (raf) cancelAnimationFrame(raf);
    document.body.classList.remove("playhead-scrubbing");
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("mouseup", onUp, true);
    previewCompTime(pendingTime);
    hideSnapGuide();

    // Final commit always wins, even if the throttled live update skipped the last few pixels.
    suppressSyncUntil = Date.now() + 700;
    if (Math.abs(lastSentTime - pendingTime) > 0.0001 || liveSendInFlight) {
      await commitPreviewCompTime(pendingTime);
    } else {
      await syncTick();
    }
  };

  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("mouseup", onUp, true);
}

function stopPlayback(commit = true) {
  playbackGeneration++;
  isPlaying = false;
  if (typeof playTimer === "number") {
    clearInterval(playTimer);
  }
  playTimer = null;
  if (playbackRaf) {
    cancelAnimationFrame(playbackRaf);
    playbackRaf = 0;
  }
  document.body.classList.remove("playback-active");
  playbackPendingAeTime = null;
  if (commit && state.comp) {
    suppressSyncUntil = Date.now() + 700;
    return setCompTime(state.comp.time || 0)
      .then(() => syncTick());
  }
  return Promise.resolve();
}

function startPlayback() {
  stopPlayback(false);
  if (!state.comp) return;
  const generation = ++playbackGeneration;
  isPlaying = true;
  document.body.classList.add("playback-active");
  playbackStartMs = performance.now();
  playbackStartTime = Number(state.comp.time || 0);
  playbackLastAeSendMs = 0;
  playbackLastAeFrame = -1;
  playbackAeInFlight = false;
  playbackPendingAeTime = null;
  playTimer = "raf";
  const fps = Math.max(1, Number(state.comp.frameRate || 30));
  const frameDuration = Number(state.comp.frameDuration || (1 / fps));
  // CEP can animate at display refresh, but CompItem.time is a host seek that
  // forces AE to render. Limit those seeks so they cannot starve input/rendering.
  const minimumAeSendInterval = Math.max(1000 / Math.min(fps, 15), AE_EVAL_MIN_GAP_MS);
  let adaptiveAeSendInterval = minimumAeSendInterval;

  const queuePlaybackTimeToAe = async (time, now) => {
    if (generation !== playbackGeneration) return;
    playbackPendingAeTime = time;
    if (playbackAeInFlight || now - playbackLastAeSendMs < adaptiveAeSendInterval) return;

    const nextTime = playbackPendingAeTime;
    playbackPendingAeTime = null;
    playbackAeInFlight = true;
    playbackLastAeSendMs = now;
    const requestStartedAt = performance.now();
    try {
      await aeCall("TNT_setTime", [nextTime]);
    } finally {
      if (generation === playbackGeneration) {
        playbackAeInFlight = false;
        const roundTripMs = Math.max(1, performance.now() - requestStartedAt);
        // Never saturate CEP's serialized ExtendScript bridge. Keep the local
        // rAF playhead smooth while matching AE as quickly as the comp permits.
        adaptiveAeSendInterval = Math.max(
          minimumAeSendInterval,
          Math.min(180, roundTripMs * 1.15)
        );
      }
    }
  };

  const tick = now => {
    if (!isPlaying || generation !== playbackGeneration || !state.comp) return;
    const duration = Math.max(0, Number(state.comp.duration || 0));
    let time = playbackStartTime + Math.max(0, now - playbackStartMs) / 1000;
    if (duration > 0 && time >= duration) {
      time = duration;
      state.comp.time = time;
      updateStatus();
      updatePlayhead({ time, fast: true });
      stopPlayback();
      return;
    }
    state.comp.time = time;
    if (timeDisplayEl && !isTimeDisplayEditing) timeDisplayEl.textContent = formatTime(time);
    updatePlayhead({ time, fast: true });
    const frameIndex = Math.max(0, Math.min(
      Math.round(duration / Math.max(frameDuration, 1e-6)),
      Math.floor((time + frameDuration * 0.25) / Math.max(frameDuration, 1e-6))
    ));
    if (frameIndex !== playbackLastAeFrame) {
      playbackLastAeFrame = frameIndex;
      queuePlaybackTimeToAe(frameIndex * frameDuration, now);
    }
    playbackRaf = requestAnimationFrame(tick);
  };

  playbackRaf = requestAnimationFrame(tick);
}

function stopPlaybackOnTimelinePointer(event) {
  if (!isPlaying || !event) return;
  if (event.button !== 0 && event.button !== 1 && event.button !== 2) return;
  const target = event.target;
  if (!target || !(scrollAreaEl === target || (scrollAreaEl.contains && scrollAreaEl.contains(target)))) return;
  if (target.closest && target.closest("#assistantHub")) return;
  stopPlayback(false).then(() => focusPanel(2));
}

function togglePlay() {
  if (isPlaying) stopPlayback();
  else startPlayback();
  focusPanel(1);
}

function zoomTimeline(multiplier) {
  if (!state.comp) return;
  const oldPixels = pixelsPerSecond;
  const playheadTime = state.comp.time || 0;
  const fitPps = fittedPixelsPerSecond();

  pixelsPerSecond = Math.max(
    fitPps,
    Math.min(MAX_PIXELS_PER_SECOND, pixelsPerSecond * multiplier)
  );

  // If we are back at fit, exit manual zoom mode so resize/refresh keeps it fitted.
  userZoomed = pixelsPerSecond > fitPps + 0.01;
  if (Math.abs(oldPixels - pixelsPerSecond) < 0.01) return;

  render();

  // Keep the playhead as the visual center of the zoom, instead of zooming from timeline start.
  const playheadX = timeToX(playheadTime);
  scrollAreaEl.scrollLeft = Math.max(0, playheadX - timelineViewportWidth() / 2);
}


function isInRuler(target) {
  return target.closest && target.closest(".time-ruler-wrap");
}

function handleTimelineMouseDown(event) {
  if (!state.comp || isInRuler(event.target)) return;
  if (event.target.closest && event.target.closest("#assistantHub")) return;

  // Middle mouse click places the playhead; hold + drag scrubs it.
  if (event.button === 1) {
    beginMiddleScrub(event);
    return;
  }

  if (event.button !== 0) return;
  if (event.target.closest && event.target.closest(".clip")) return;
  if (event.target.closest && event.target.closest(".property-keyframe-marker")) return;
  hideLayerMenu();
  beginMarqueeSelect(event);
}

function clipRectToLayerIndex(clip) {
  return Number(clip.dataset.layerIndex);
}

function rectsIntersect(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function beginMarqueeSelect(event, initialMoveEvent) {
  isMarqueeSelecting = true;
  event.preventDefault();

  const additive = event.shiftKey || event.ctrlKey || event.metaKey;
  const startX = event.clientX;
  const startY = event.clientY;
  let lastClientX = startX;
  let lastClientY = startY;
  let autoScrollTimer = 0;
  selectionBoxEl.style.display = "block";
  selectionBoxEl.style.left = `${startX}px`;
  selectionBoxEl.style.top = `${startY}px`;
  selectionBoxEl.style.width = `0px`;
  selectionBoxEl.style.height = `0px`;

  let latestSelected = [];
  let latestKeyframes = [];
  const updateBox = (moveEvent) => {
    lastClientX = moveEvent.clientX;
    lastClientY = moveEvent.clientY;
    const left = Math.min(startX, moveEvent.clientX);
    const top = Math.min(startY, moveEvent.clientY);
    const width = Math.abs(moveEvent.clientX - startX);
    const height = Math.abs(moveEvent.clientY - startY);
    selectionBoxEl.style.left = `${left}px`;
    selectionBoxEl.style.top = `${top}px`;
    selectionBoxEl.style.width = `${width}px`;
    selectionBoxEl.style.height = `${height}px`;

    const boxRect = selectionBoxEl.getBoundingClientRect();
    latestSelected = [];
    latestKeyframes = [];
    document.querySelectorAll(".clip").forEach(clip => {
      const hit = rectsIntersect(boxRect, clip.getBoundingClientRect());
      clip.classList.toggle("marquee-hit", hit);
      if (hit) latestSelected.push(clipRectToLayerIndex(clip));
    });
    if (timelineMode === "keyframe") {
      document.querySelectorAll(".property-keyframe-marker").forEach(keyEl => {
        const hit = rectsIntersect(boxRect, keyEl.getBoundingClientRect());
        keyEl.classList.toggle("marquee-hit", hit);
        if (hit) latestKeyframes.push({
          layerIndex: Number(keyEl.dataset.layerIndex || 0),
          propertyPath: keyEl.dataset.propertyPath || "",
          keyIndex: Number(keyEl.dataset.keyIndex || 0)
        });
      });
    }
  };

  const autoScrollTick = () => {
    if (!isMarqueeSelecting) return;
    const rect = scrollAreaEl.getBoundingClientRect();
    const edge = 34;
    const maxStep = 22;
    let dx = 0;
    let dy = 0;
    if (lastClientX < rect.left + edge) dx = -Math.round(maxStep * (1 - Math.max(0, lastClientX - rect.left) / edge));
    else if (lastClientX > rect.right - edge) dx = Math.round(maxStep * (1 - Math.max(0, rect.right - lastClientX) / edge));
    if (lastClientY < rect.top + edge) dy = -Math.round(maxStep * (1 - Math.max(0, lastClientY - rect.top) / edge));
    else if (lastClientY > rect.bottom - edge) dy = Math.round(maxStep * (1 - Math.max(0, rect.bottom - lastClientY) / edge));
    if (!dx && !dy) return;
    const beforeX = scrollAreaEl.scrollLeft;
    const beforeY = scrollAreaEl.scrollTop;
    scrollAreaEl.scrollLeft = Math.max(0, scrollAreaEl.scrollLeft + dx);
    scrollAreaEl.scrollTop = Math.max(0, scrollAreaEl.scrollTop + dy);
    if (scrollAreaEl.scrollLeft !== beforeX || scrollAreaEl.scrollTop !== beforeY) {
      syncBottomRulerPosition();
      updateBox({ clientX: lastClientX, clientY: lastClientY });
    }
  };
  autoScrollTimer = setInterval(autoScrollTick, 16);

  const finish = async (upEvent) => {
    document.removeEventListener("mousemove", updateBox, true);
    document.removeEventListener("mouseup", finish, true);
    if (autoScrollTimer) clearInterval(autoScrollTimer);
    selectionBoxEl.style.display = "none";
    document.querySelectorAll(".clip.marquee-hit").forEach(clip => clip.classList.remove("marquee-hit"));
    document.querySelectorAll(".property-keyframe-marker.marquee-hit").forEach(keyEl => keyEl.classList.remove("marquee-hit"));
    isMarqueeSelecting = false;

    // Treat a tiny click on empty track as deselect, similar to AE timeline behavior.
    if (Math.abs(upEvent.clientX - startX) < 3 && Math.abs(upEvent.clientY - startY) < 3) {
      latestSelected = [];
      latestKeyframes = [];
    }
    if (latestKeyframes.length) {
      const keyLayerIndices = [...new Set(latestKeyframes.map(key => key.layerIndex).filter(Boolean))];
      state.selectedLayerIndices = additive
        ? [...new Set([...(state.selectedLayerIndices || []), ...keyLayerIndices])]
        : keyLayerIndices;
      renderSelectionOnly();
      await setSelectedLayers(state.selectedLayerIndices, false);
      await selectKeyframes(latestKeyframes, additive);
      return;
    }
    if (timelineMode === "keyframe" || selectedKeyframes.length) {
      await clearSelectedKeyframes({ forceHost: true });
    }
    await setSelectedLayers(latestSelected, additive);
    syncTick();
  };

  document.addEventListener("mousemove", updateBox, true);
  document.addEventListener("mouseup", finish, true);
  if (initialMoveEvent) updateBox(initialMoveEvent);
}

async function setSelectedLayers(indices, additive = false) {
  suppressSyncUntil = Date.now() + 700;
  const requested = (indices || []).map(Number).filter(Boolean);
  if (requested.length) lastSelectedLayerIndex = requested[requested.length - 1];
  await loadJSX();
  const result = await aeCall("TNT_setSelectedLayers", [indices, additive]);
  if (result.ok) {
    state.selectedLayerIndices = result.selectedLayerIndices || [];
    renderSelectionOnly();
  } else {
    statusEl.textContent = result.error || "Could not update selection.";
  }
}

async function selectAllLayers() {
  if (!state.comp || !state.layers || !state.layers.length) return;
  const indices = state.layers.map(layer => layer.index).filter(index => Number(index) >= 1);
  if (!indices.length) return;
  await setSelectedLayers(indices, false);
  focusPanel(2);
}

async function duplicateSelectedLayers(indicesOverride) {
  if (!state.comp) return;
  const selected = Array.isArray(indicesOverride) && indicesOverride.length
    ? indicesOverride.slice()
    : (state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : []);
  suppressSyncUntil = Date.now() + 1000;
  setPanelSyncPaused(false);
  panelFocused = true;
  panelPointerInside = true;
  focusPanel(1);
  await loadJSX();
  const result = await aeCall("TNT_duplicateSelectedLayers", [selected]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not duplicate selected layers.";
    focusPanel(2);
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || [];
  await refreshLayerStructureAfterAction();
  focusPanel(4);
}

async function deleteSelectedLayers() {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_deleteSelectedLayers", [selected]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not delete selected layers.";
    return;
  }
  state.selectedLayerIndices = [];
  await refreshLayerStructureAfterAction();
}

async function createLayerFromFxConsole(type) {
  if (!state.comp) return;
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_createLayerFromPanel", [type, state.comp.time || 0]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not add layer.";
    focusPanel(2);
    return;
  }
  statusEl.textContent = `Added ${result.name || "layer"}.`;
  state.selectedLayerIndices = result.layerIndex ? [result.layerIndex] : [];
  await refreshLayerStructureAfterAction();
  focusPanel(2);
}

async function deleteSelectedKeyframes() {
  if (!state.comp || !selectedKeyframes.length) return;
  const keys = selectedKeyframes.slice();
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_deleteSelectedPropertyKeys", [keys]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not delete selected keyframes.";
    return;
  }
  selectedKeyframes = [];
  await refreshLayers({ forceRender: true });
  focusPanel(2);
}

async function deleteSelectedLevel() {
  if (selectedKeyframes.length) {
    await deleteSelectedKeyframes();
    return;
  }
  await deleteSelectedLayers();
}

async function splitSelectedLayersAtPlayhead() {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_splitSelectedLayersAtTime", [selected, snapTimeToFrame(state.comp.time || 0)]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not split selected layers.";
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || [];
  await refreshLayerStructureAfterAction();
}

async function setSelectedLayerEndpoint(endpoint) {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_setSelectedLayerEndpoint", [selected, endpoint, snapTimeToFrame(state.comp.time || 0)]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not set layer point.";
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || state.selectedLayerIndices || [];
  await refreshLayerStructureAfterAction();
  focusPanel(2);
}

async function moveSelectedLayersInStack(mode) {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  const anchorIndex = mode === "anchor-last" && selected.includes(Number(lastSelectedLayerIndex))
    ? Number(lastSelectedLayerIndex)
    : 0;
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_moveSelectedLayersInStack", [selected, mode, anchorIndex]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not move selected layers.";
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || [];
  if (!applyTimelineStructureResult(result, { skipSettledRefresh: true })) {
    await refreshLayerStructureAfterAction();
  }
  statusEl.textContent = result.result || "Layer order updated.";
  focusPanel(2);
}

async function orderSelectedLayersAroundTarget(direction, basis, proximity = "closest") {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length
    ? state.selectedLayerIndices.slice()
    : [];
  const targetIndex = selected.includes(Number(lastSelectedLayerIndex))
    ? Number(lastSelectedLayerIndex)
    : 0;
  if (selected.length < 2 || !targetIndex) {
    statusEl.textContent = "Select other layers, then click the target layer last.";
    return;
  }
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_orderLayersAroundTarget", [
    selected,
    targetIndex,
    String(basis || "in"),
    String(direction || "bottom-up"),
    String(proximity || "closest")
  ]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not order layers around the target.";
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || [];
  if (Number(result.targetLayerIndex) > 0) {
    lastSelectedLayerIndex = Number(result.targetLayerIndex);
  }
  if (!applyTimelineStructureResult(result, { skipSettledRefresh: true })) {
    await refreshLayerStructureAfterAction();
  }
  statusEl.textContent = result.result || "Layers ordered around target.";
  focusPanel(2);
}

async function sortSelectedLayersByOrder(basis, direction = "asc") {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length
    ? state.selectedLayerIndices.slice()
    : [];
  if (selected.length < 2) {
    statusEl.textContent = "Select at least two layers to sort.";
    return;
  }
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_sortSelectedLayers", [
    selected,
    String(basis || "in"),
    String(direction || "asc")
  ]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not sort selected layers.";
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || [];
  if (!applyTimelineStructureResult(result, { skipSettledRefresh: true })) {
    await refreshLayerStructureAfterAction();
  }
  statusEl.textContent = result.result || "Layers sorted.";
  focusPanel(2);
}

async function runLayerTimingAction(action, options = {}) {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_snapPullStaggerLayers", [selected, action, options]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not run layer timing action.";
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || state.selectedLayerIndices || [];
  if (!applyTimelineStructureResult(result, { skipSettledRefresh: true })) {
    await refreshLayerStructureAfterAction();
  }
  statusEl.textContent = result.result || "Layer timing updated.";
  focusPanel(2);
}

async function runKeyframeTimingAction(action, options = {}) {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length
    ? state.selectedLayerIndices.slice()
    : [...new Set((selectedKeyframes || []).map(key => Number(key.layerIndex || 0)).filter(Boolean))];
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_snapPullStaggerKeyframes", [selected, action, options]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not run keyframe timing action.";
    return;
  }
  await refreshLayers({ forceRender: true });
  focusPanel(2);
}

function undoLastAeAction() {
  pendingUndoRequests++;
  suppressSyncUntil = Date.now() + 700;
  recentPanelShortcutUntil = Date.now() + 1200;
  setPanelSyncPaused(false);
  panelFocused = true;
  panelPointerInside = true;
  focusPanel(2);
  drainUndoRequests();
}

async function drainUndoRequests() {
  if (undoDrainInFlight) return;
  undoDrainInFlight = true;
  await loadJSX();
  let latestStructure = null;
  try {
    while (pendingUndoRequests > 0) {
      pendingUndoRequests--;
      const result = await aeCall("TNT_undoNativeHistory", [true]);
      if (!result.ok || result.changed === false) {
        statusEl.textContent = result.error || "Could not undo.";
        pendingUndoRequests = 0;
        break;
      }
      if (result.structure && result.structure.ok) latestStructure = result.structure;
    }
  } finally {
    undoDrainInFlight = false;
  }
  if (pendingUndoRequests > 0) {
    drainUndoRequests();
    return;
  }
  if (latestStructure && timelineMode !== "keyframe") {
    applyTimelineStructureResult(latestStructure);
  } else {
    await refreshLayers({
      forceRender: true,
      includeSelectedKeyframes: timelineMode === "keyframe"
    });
  }
  panelFocused = true;
  panelPointerInside = true;
  focusPanel(2);
}
