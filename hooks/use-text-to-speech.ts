"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseTextToSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const { lang = "en-US", rate = 0.9, pitch = 1, volume = 1 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports Speech Synthesis
    setIsSupported("speechSynthesis" in window);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) {
        toast({
          title: "Not Supported",
          description: "Your browser doesn't support text-to-speech",
          variant: "destructive",
        });
        return;
      }

      if (!text || text.trim() === "") {
        toast({
          title: "No Text",
          description: "Please provide text to speak",
          variant: "destructive",
        });
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsSpeaking(false);
        toast({
          title: "Speech Error",
          description: "An error occurred while speaking",
          variant: "destructive",
        });
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, lang, rate, pitch, volume, toast]
  );

  const stop = useCallback(() => {
    if (isSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (isSupported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
  };
}
