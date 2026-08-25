export type FxId =
  | "normal"
  | "eco"
  | "catedral"
  | "ardilla"
  | "gigante"
  | "robot"
  | "megafono"
  | "lenta"
  | "rapida";

export interface FxDef {
  id: FxId;
  name: string;
  desc: string;
  rate?: number;
  preserve?: boolean;
  /** cola extra (s) que añade el efecto, para el render offline */
  tail: number;
}

export const FX_LIST: FxDef[] = [
  { id: "normal", name: "Original", desc: "Tal cual se grabó", tail: 0.05 },
  { id: "eco", name: "Eco", desc: "Rebote de montaña", tail: 1.5 },
  { id: "catedral", name: "Catedral", desc: "Reverberación amplia", tail: 2.5 },
  { id: "ardilla", name: "Ardilla", desc: "Aguda y veloz", rate: 1.4, preserve: false, tail: 0.05 },
  { id: "gigante", name: "Gigante", desc: "Grave y enorme", rate: 0.78, preserve: false, tail: 0.05 },
  { id: "robot", name: "Robot", desc: "Voz modulada en anillo", tail: 0.25 },
  { id: "megafono", name: "Megáfono", desc: "Radio de otra época", tail: 0.15 },
  { id: "lenta", name: "Cámara lenta", desc: "Tiempo estirado, tono igual", rate: 0.7, preserve: true, tail: 0.1 },
  { id: "rapida", name: "Acelerada", desc: "Tiempo comprimido", rate: 1.35, preserve: true, tail: 0.05 },
];

export const fxDef = (id: FxId): FxDef => FX_LIST.find((f) => f.id === id) ?? FX_LIST[0];

function impulseResponse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function distortionCurve(k: number): Float32Array<ArrayBuffer> {
  const n = 257;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/**
 * Construye la cadena de efectos y devuelve la fuente de audio (sin arrancar).
 * Funciona igual en un AudioContext en vivo que en un OfflineAudioContext.
 */
export function buildGraph(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  fx: FxId
): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const def = fxDef(fx);
  if (def.rate) src.playbackRate.value = def.rate;
  if (def.preserve !== undefined) {
    const p = src as AudioBufferSourceNode & {
      preservePitch?: boolean;
      preservesPitch?: boolean;
    };
    p.preservePitch = def.preserve;
    p.preservesPitch = def.preserve;
  }

  const out = ctx.destination;
  const dur = buffer.duration / (def.rate ?? 1);

  switch (fx) {
    case "eco": {
      const dry = ctx.createGain();
      dry.gain.value = 0.9;
      const wet = ctx.createGain();
      wet.gain.value = 0.55;
      const delay = ctx.createDelay(2);
      delay.delayTime.value = 0.31;
      const fb = ctx.createGain();
      fb.gain.value = 0.42;
      src.connect(dry).connect(out);
      src.connect(delay);
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(wet).connect(out);
      break;
    }
    case "catedral": {
      const dry = ctx.createGain();
      dry.gain.value = 0.72;
      const wet = ctx.createGain();
      wet.gain.value = 0.62;
      const conv = ctx.createConvolver();
      conv.buffer = impulseResponse(ctx, 2.4, 2.6);
      src.connect(dry).connect(out);
      src.connect(conv);
      conv.connect(wet).connect(out);
      break;
    }
    case "robot": {
      const shaper = ctx.createWaveShaper();
      shaper.curve = distortionCurve(28);
      const am = ctx.createGain();
      am.gain.value = 0.55;
      const carrier = ctx.createOscillator();
      carrier.frequency.value = 52;
      const depth = ctx.createGain();
      depth.gain.value = 0.45;
      carrier.connect(depth);
      depth.connect(am.gain);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 950;
      bp.Q.value = 0.55;
      src.connect(shaper);
      shaper.connect(am);
      am.connect(bp);
      bp.connect(out);
      carrier.start(0);
      carrier.stop(ctx.currentTime + dur + 1);
      break;
    }
    case "megafono": {
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 260;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1250;
      bp.Q.value = 1.05;
      const shaper = ctx.createWaveShaper();
      shaper.curve = distortionCurve(8);
      const g = ctx.createGain();
      g.gain.value = 1.15;
      src.connect(hp);
      hp.connect(bp);
      bp.connect(shaper);
      shaper.connect(g);
      g.connect(out);
      break;
    }
    default:
      src.connect(out);
  }
  return src;
}

/** Renderiza el audio con el efecto aplicado (para exportar a WAV). */
export async function renderWithFx(buffer: AudioBuffer, fx: FxId): Promise<AudioBuffer> {
  const def = fxDef(fx);
  const dur = buffer.duration / (def.rate ?? 1) + def.tail;
  const octx = new OfflineAudioContext(
    Math.min(2, buffer.numberOfChannels),
    Math.ceil(dur * buffer.sampleRate),
    buffer.sampleRate
  );
  const src = buildGraph(octx, buffer, fx);
  src.start();
  return octx.startRendering();
}

/** Codifica un AudioBuffer como WAV PCM de 16 bits. */
export function encodeWav(ab: AudioBuffer): Blob {
  const numCh = Math.min(2, ab.numberOfChannels);
  const sr = ab.sampleRate;
  const len = ab.length;
  const bytes = 44 + len * numCh * 2;
  const buf = new ArrayBuffer(bytes);
  const v = new DataView(buf);

  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  v.setUint32(4, bytes - 8, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, numCh, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * numCh * 2, true);
  v.setUint16(32, numCh * 2, true);
  v.setUint16(34, 16, true);
  writeStr(36, "data");
  v.setUint32(40, len * numCh * 2, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numCh; ch++) channels.push(ab.getChannelData(ch));

  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, channels[ch][i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([buf], { type: "audio/wav" });
}

/** Picos normalizados de la forma de onda, para dibujar la miniatura. */
export function makePeaks(buffer: AudioBuffer, buckets = 72): number[] {
  const data = buffer.getChannelData(0);
  const size = Math.max(1, Math.floor(data.length / buckets));
  const out: number[] = [];
  for (let i = 0; i < buckets; i++) {
    let max = 0;
    const start = i * size;
    const end = Math.min(data.length, start + size);
    for (let j = start; j < end; j += 4) {
      const a = Math.abs(data[j]);
      if (a > max) max = a;
    }
    out.push(max);
  }
  const top = Math.max(0.01, ...out);
  return out.map((x) => x / top);
}
