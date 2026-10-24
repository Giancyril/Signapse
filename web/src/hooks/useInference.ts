import { useState, useEffect, useRef, useCallback } from 'react';
import * as ort from 'onnxruntime-web';
import { LABELS } from '../lib/labels';

// Configure ONNX Runtime Web WASM paths
ort.env.wasm.wasmPaths = '/';
ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency || 4, 4);

export interface TopKPrediction {
  gloss: string;
  confidence: number; // 0.0 to 1.0
  percentage: string; // e.g. "94.2%"
}

export interface InferenceResult {
  top1: TopKPrediction | null;
  top5: TopKPrediction[];
  latencyMs: number;
}

export interface UseInferenceResult {
  isModelLoading: boolean;
  isModelReady: boolean;
  modelError: string | null;
  predict: (sequenceData: Float32Array, numFrames: number) => Promise<InferenceResult | null>;
  labels: string[];
}

function softmax(logits: Float32Array): Float32Array {
  const max = logits.reduce((m, v) => (v > m ? v : m), -Infinity);
  let sum = 0.0;
  const exps = new Float32Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    const e = Math.exp(logits[i] - max);
    exps[i] = e;
    sum += e;
  }
  for (let i = 0; i < logits.length; i++) {
    exps[i] /= sum;
  }
  return exps;
}

export function useInference(modelPath = '/model.onnx'): UseInferenceResult {
  const sessionRef = useRef<ort.InferenceSession | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      setIsModelLoading(true);
      setModelError(null);

      try {
        const options: ort.InferenceSession.SessionOptions = {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
        };

        const session = await ort.InferenceSession.create(modelPath, options);
        if (!cancelled) {
          sessionRef.current = session;
          setIsModelReady(true);
          console.log('ONNX Model loaded successfully:', modelPath);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Failed to initialize ONNX Runtime Web session.';
          console.error('Failed to load ONNX model:', err);
          setModelError(msg);
        }
      } finally {
        if (!cancelled) {
          setIsModelLoading(false);
        }
      }
    }

    loadModel();

    return () => {
      cancelled = true;
      if (sessionRef.current) {
        sessionRef.current.release();
        sessionRef.current = null;
      }
    };
  }, [modelPath]);

  const predict = useCallback(
    async (
      sequenceData: Float32Array,
      numFrames: number
    ): Promise<InferenceResult | null> => {
      const session = sessionRef.current;
      if (!session || numFrames <= 0) {
        return null;
      }

      try {
        const t0 = performance.now();

        // Input shape: (1, T, 392)
        const tensor = new ort.Tensor('float32', sequenceData, [1, numFrames, 392]);
        const feeds: Record<string, ort.Tensor> = {
          sequence: tensor,
        };

        const results = await session.run(feeds);
        const latencyMs = Math.round(performance.now() - t0);

        const outputTensor = results.logits || Object.values(results)[0];
        const logits = outputTensor.data as Float32Array;

        const probs = softmax(logits);

        // Sort indices by probability descending
        const indices = Array.from({ length: probs.length }, (_, i) => i);
        indices.sort((a, b) => probs[b] - probs[a]);

        const top5: TopKPrediction[] = indices.slice(0, 5).map((idx) => {
          const gloss = LABELS[idx] || `class_${idx}`;
          const confidence = probs[idx];
          return {
            gloss,
            confidence,
            percentage: `${(confidence * 100).toFixed(1)}%`,
          };
        });

        return {
          top1: top5[0] || null,
          top5,
          latencyMs,
        };
      } catch (err) {
        console.error('Inference execution error:', err);
        return null;
      }
    },
    []
  );

  return {
    isModelLoading,
    isModelReady,
    modelError,
    predict,
    labels: LABELS,
  };
}