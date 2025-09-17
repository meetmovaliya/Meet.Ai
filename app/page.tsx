'use client';

import { useState, useCallback, useEffect } from 'react';
import { AIModel, ChatMessage } from '@/types';
import { AVAILABLE_MODELS, DEFAULT_MODELS } from '@/lib/constants';
import ModelCard from '@/components/ModelCard';
import MessageInput from '@/components/MessageInput';
import { clsx } from 'clsx';
import { generateId } from '@/lib/utils';

export default function Home() {
  const [selectedModels, setSelectedModels] = useState<AIModel[]>(DEFAULT_MODELS);
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [bestResponseId, setBestResponseId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [fullScreenModel, setFullScreenModel] = useState<AIModel | null>(null);

  // THEME STATE
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 1000); // 1 seconds
    return () => clearTimeout(timer);
  }, []);

  // Apply theme to <body> for global CSS (optional, for Tailwind dark: support)
  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);

  const addModel = useCallback((model: AIModel) => {
    setSelectedModels(prev => [...prev, model]);
    // Only initialize empty conversation if it doesn't exist
    setConversations(prev => ({
      ...prev,
      [model.id]: prev[model.id] || []  // Preserve existing conversation or create empty array
    }));
  }, []);

  const removeModel = useCallback((modelId: string) => {
    setSelectedModels(prev => prev.filter(m => m.id !== modelId));
    if (bestResponseId?.startsWith(modelId)) {
      setBestResponseId(null);
    }
  }, [bestResponseId]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || selectedModels.length === 0) return;

    setIsLoading(true);
    setBestResponseId(null);

    // Add user message to all conversations
    const userMessage: ChatMessage = {
      id: generateId(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };

    const updatedConversations = { ...conversations };
    selectedModels.forEach(model => {
      updatedConversations[model.id] = [
        ...(updatedConversations[model.id] || []),
        userMessage
      ];
    });
    setConversations(updatedConversations);

    try {
      // Prepare conversation history for each model
      const conversationHistory: Record<string, Array<{ role: string; content: string }>> = {};
      selectedModels.forEach(model => {
        conversationHistory[model.id] = (updatedConversations[model.id] || [])
          .slice(0, -1) // Exclude the current message
          .map(msg => ({
            role: msg.role,
            content: msg.content
          }));
      });

      // Send message to all models via API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelIds: selectedModels.map(m => m.id),
          message,
          conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const responses = await response.json();

      // Add AI responses to conversations
      setConversations(prev => {
        const newConversations = { ...prev };
        
        selectedModels.forEach(model => {
          const response = responses[model.id];
          const aiMessage: ChatMessage = {
            id: generateId(),
            content: response.error || response.content,
            role: 'assistant',
            timestamp: new Date()
          };

          newConversations[model.id] = [
            ...(newConversations[model.id] || []),
            aiMessage
          ];
        });

        return newConversations;
      });
    } catch (error) {
      console.error('Error sending messages:', error);
      
      // Add error messages to all conversations
      setConversations(prev => {
        const newConversations = { ...prev };
        
        selectedModels.forEach(model => {
          const errorMessage: ChatMessage = {
            id: generateId(),
            content: 'Failed to get response. Please try again.',
            role: 'assistant',
            timestamp: new Date()
          };

          newConversations[model.id] = [
            ...(newConversations[model.id] || []),
            errorMessage
          ];
        });

        return newConversations;
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedModels, conversations]);

  const copyResponse = useCallback(async (modelId: string) => {
    const modelConversation = conversations[modelId] || [];
    const lastAssistantMessage = modelConversation
      .filter(m => m.role === 'assistant')
      .pop();

    if (lastAssistantMessage) {
      try {
        await navigator.clipboard.writeText(lastAssistantMessage.content);
        console.log('Response copied to clipboard');
      } catch (error) {
        console.error('Failed to copy response:', error);
      }
    }
  }, [conversations]);

  const pickBest = useCallback((modelId: string) => {
    const responseId = `${modelId}-${Date.now()}`;
    setBestResponseId(bestResponseId === responseId ? null : responseId);

    // Set full screen mode
    const model = selectedModels.find(m => m.id === modelId);
    if (model) {
      setFullScreenModel(model);
    }
  }, [bestResponseId, selectedModels]);

  const exitFullScreen = useCallback(() => {
    setFullScreenModel(null);
  }, []);

  // --- UI ---
  if (!mounted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          <span className="text-white text-lg font-semibold">Your Ai ChatBot is loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      "h-screen flex flex-col overflow-hidden transition-colors duration-300",
      theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
    )}>
      {/* Animated background particles - only render on client */}
      {mounted && (
        <div className="particles">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${4 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Header with Logo */}
      <header className={clsx(
        "border-b p-3 sm:p-4 flex-shrink-0 transition-colors duration-300",
        theme === 'dark' ? 'bg-black border-gray-700/50' : 'bg-white border-gray-200'
      )}>
        <div className="flex items-center justify-between gap-2">
          {/* Left Side - Logo Only */}
          <div
            className="flex items-center gap-2 sm:gap-3 group cursor-pointer"
            onClick={() => window.location.reload()}
          >
            <div className={clsx(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300",
              theme === 'dark'
                ? "bg-gradient-to-r from-blue-500 to-purple-500"
                : "bg-gradient-to-r from-gray-200 to-gray-400"
            )}>
              <span className={clsx(
                "font-bold text-base sm:text-lg transition-transform duration-300",
                theme === 'dark' ? "text-white" : "text-black"
              )}>Ai</span>
            </div>
            <div className="group-hover:translate-x-1 transition-transform duration-300">
              <h1 className={clsx(
                "text-lg sm:text-xl font-bold transition-all duration-300",
                theme === 'dark' ? "text-white" : "text-black"
              )}>meet.AI</h1>
              <p className={clsx(
                "text-[10px] sm:text-xs transition-colors duration-300",
                theme === 'dark' ? "text-gray-400 group-hover:text-gray-300" : "text-gray-500 group-hover:text-gray-700"
              )}>Compare AI models in real-time</p>
            </div>
          </div>

          {/* Center - Contact & Resume */}
          <div className="hidden sm:flex flex-1 justify-center">
            <div className="flex items-center gap-3 sm:gap-4">
             
              {/* Resume with tooltip */}
              <div className="relative group">
                <a
                  href="/resume.pdf"
                  download
                  className="px-2.5 py-1.5 sm:px-3 sm:py-1 rounded bg-purple-500 text-white text-xs font-semibold hover:bg-blue-700 transition"
                >
                  Download my Resume
                </a>
                {/* Tooltip */}
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                  Click on it to download my resume
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Module Bars + Toggle Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Module Bars - Show when expanded */}
            {showModuleSelector && (
              <div className="hidden md:flex flex-wrap gap-3 sm:gap-4 ml-2 sm:ml-4">
                {AVAILABLE_MODELS.map((model) => {
                  const isSelected = selectedModels.some(m => m.id === model.id);
                  return (
                    <button
                      key={model.id}
                      onClick={(e) => {
                        e.preventDefault();
                        if (isSelected) {
                          removeModel(model.id);
                        } else {
                          addModel(model);
                        }
                      }}
                      className={clsx(
                        'px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap hover:scale-110 hover:shadow-lg hover:-translate-y-0.5',
                        isSelected
                          ? (theme === 'dark'
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105 ring-2 ring-white/20'
                              : 'bg-gradient-to-r from-gray-200 to-gray-400 text-black shadow-lg transform scale-105 ring-2 ring-black/10')
                          : (theme === 'dark'
                              ? 'bg-gray-700/50 hover:bg-gradient-to-r hover:from-gray-600 hover:to-gray-500 text-gray-300 hover:text-white'
                              : 'bg-gray-200 hover:bg-gradient-to-r hover:from-gray-300 hover:to-gray-400 text-gray-700 hover:text-black')
                      )}
                    >
                      <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
                      <span className="truncate max-w-20">{model.provider}</span>
                      {isSelected && <span className="text-xs opacity-75">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Module Toggle Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowModuleSelector(!showModuleSelector);
              }}
              className={clsx(
                "px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 hover:scale-105",
                theme === 'dark'
                  ? "bg-gray-700/50 hover:bg-gray-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-black"
              )}
            >
              <span className={`transform transition-transform ${showModuleSelector ? '' : 'rotate-180'}`}>
                ◀
              </span>
              <span>Models</span>
            </button>

            {/* THEME TOGGLE BUTTON */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={clsx(
                "ml-1 sm:ml-2 p-2 rounded-full border transition",
                theme === 'dark'
                  ? "border-gray-500 bg-transparent hover:bg-gray-700"
                  : "border-gray-300 bg-transparent hover:bg-gray-200"
              )}
              aria-label="Toggle dark/light mode"
              title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === 'dark' ? (
                // Sun icon for light mode
                <svg width="20" height="20" fill="none" stroke="currentColor" className="text-yellow-400"><circle cx="10" cy="10" r="4" strokeWidth="2"/><path strokeWidth="2" d="M10 2v2m0 12v2m8-8h-2M4 10H2m13.66-5.66l-1.42 1.42M6.34 17.66l-1.42-1.42m12.72 0l-1.42-1.42M6.34 2.34l-1.42 1.42"/></svg>
              ) : (
                // Moon icon for dark mode
                <svg width="20" height="20" fill="none" stroke="currentColor" className="text-gray-800"><path strokeWidth="2" d="M15.5 13A6.5 6.5 0 017 4.5a6.5 6.5 0 108.5 8.5z"/></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-3 sm:p-4 overflow-hidden">
          {fullScreenModel ? (
            /* Full Screen Mode */
            <div className="h-full relative">
              <button
                onClick={exitFullScreen}
                className={clsx(
                  "absolute top-3 sm:top-4 right-3 sm:right-4 z-10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2",
                  theme === 'dark'
                    ? "bg-gray-700/50 hover:bg-gray-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-black"
                )}
              >
                <span>✕</span>
                <span className="hidden sm:inline">Exit Full Screen</span>
              </button>
              <div className="h-full pt-14 sm:pt-16">
                <ModelCard
                  model={fullScreenModel}
                  messages={conversations[fullScreenModel.id] || []}
                  isLoading={isLoading}
                  onRemove={() => {
                    removeModel(fullScreenModel.id);
                    setFullScreenModel(null);
                  }}
                  onCopy={() => copyResponse(fullScreenModel.id)}
                  onPickBest={() => pickBest(fullScreenModel.id)}
                  isBest={bestResponseId?.startsWith(fullScreenModel.id) || false}
                  theme={theme}
                />
              </div>
            </div>
          ) : selectedModels.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className={clsx(
                  "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6",
                  theme === 'dark'
                    ? "bg-gradient-to-r from-blue-500 to-purple-500"
                    : "bg-gradient-to-r from-gray-200 to-gray-400"
                )}>
                  <span className={clsx(
                    "text-2xl sm:text-3xl font-bold",
                    theme === 'dark' ? "text-white" : "text-black"
                  )}>AI</span>
                </div>
                <h2 className={clsx(
                  "text-xl sm:text-2xl font-bold mb-1 sm:mb-2",
                  theme === 'dark' ? "text-gray-200" : "text-gray-800"
                )}>Welcome to meet.AI</h2>
                <p className={clsx(
                  "mb-4 sm:mb-6 max-w-md mx-auto px-3 sm:px-0 text-sm sm:text-base",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Click the "Models" button above to select AI models and start comparing their responses in real-time.
                </p>
                <div className={clsx(
                  "text-xs sm:text-sm",
                  theme === 'dark' ? "text-gray-500" : "text-gray-500"
                )}>
                  Choose from DeepSeek, Llama, Mistral, and Gemini models
                </div>
              </div>
            </div>
          ) : (
            <div className={clsx(
              'grid gap-3 sm:gap-8 h-full overflow-hidden',
              'grid-cols-1',
              selectedModels.length === 2 && 'sm:grid-cols-2',
              selectedModels.length === 3 && 'sm:grid-cols-3',
              selectedModels.length >= 4 && 'sm:grid-cols-2 lg:grid-cols-4'
            )}>
              {selectedModels.map((model) => (
                <div key={model.id} className="h-full overflow-hidden">
                  <ModelCard
                    model={model}
                    messages={conversations[model.id] || []}
                    isLoading={isLoading}
                    onRemove={() => removeModel(model.id)}
                    onCopy={() => copyResponse(model.id)}
                    onPickBest={() => pickBest(model.id)}
                    isBest={bestResponseId?.startsWith(model.id) || false}
                    theme={theme}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Message Input */}
      <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/30">
        <MessageInput
          onSendMessage={sendMessage}
          isLoading={isLoading}
          modelCount={selectedModels.length}
          theme={theme}
        />
      </div>
    </div>
  );
}