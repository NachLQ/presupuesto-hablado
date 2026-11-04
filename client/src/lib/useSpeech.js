import { useEffect, useRef, useState, useCallback } from 'react';

// Hook sobre la Web Speech API (reconocimiento de voz del navegador, sin API externa).
// Compatible con Chrome (escritorio y Android) y Edge. Devuelve el texto reconocido.
export function useSpeech() {
  const Recognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  const soportado = !!Recognition;

  const [escuchando, setEscuchando] = useState(false);
  const [parcial, setParcial] = useState('');
  const [error, setError] = useState(null);
  const recRef = useRef(null);
  const onFinalRef = useRef(null);

  useEffect(() => {
    if (!soportado) return;
    const rec = new Recognition();
    rec.lang = 'es-ES';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + ' ';
        else interim += t;
      }
      if (final && onFinalRef.current) onFinalRef.current(final.trim());
      setParcial(interim);
    };
    rec.onerror = (e) => {
      setError(e.error || 'error de reconocimiento');
      setEscuchando(false);
    };
    rec.onend = () => {
      setEscuchando(false);
      setParcial('');
    };

    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
    };
  }, [soportado]);

  const iniciar = useCallback((onFinal) => {
    if (!recRef.current) return;
    onFinalRef.current = onFinal;
    setError(null);
    try {
      recRef.current.start();
      setEscuchando(true);
    } catch {
      // start() lanza si ya estaba activo; lo ignoramos
    }
  }, []);

  const detener = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch {}
    setEscuchando(false);
  }, []);

  return { soportado, escuchando, parcial, error, iniciar, detener };
}
