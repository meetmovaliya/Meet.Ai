import { useState } from 'react';
import { AIModel, ChatMessage as ChatMessageType } from '@/types';
import { Copy, Award, X } from 'lucide-react';
import { clsx } from 'clsx';
import ChatMessage from './ChatMessage';
import { copyToClipboard } from '@/lib/utils';

interface ModelCardProps {
  model: AIModel;
  messages: ChatMessageType[];
  isLoading: boolean;
  error?: string;
  onRemove: () => void;
  onCopy: () => void;
  onPickBest: () => void;
  isBest: boolean;
}

export default function ModelCard({
  model,
  messages,
  isLoading,
  error,
  onRemove,
  onCopy,
  onPickBest,
  isBest,
  theme
}: ModelCardProps & { theme: 'light' | 'dark' }) {
  const [isCopied, setIsCopied] = useState(false);
  const [copyTimeout, setCopyTimeout] = useState<NodeJS.Timeout | null>(null);

  const lastAssistantMessage = messages
    .filter(m => m.role === 'assistant')
    .pop();

  return (
    <div className={clsx(
      "flex flex-col h-full rounded-xl overflow-hidden transition-all duration-500 group",
      theme === 'dark'
        ? "bg-[#18181b] border border-[#27272a] hover:bg-[#23232b]"
        : "bg-[#f7f7fa] border border-[#e5e7eb] hover:bg-[#ececf1]"
    )}>
      {/* Header */}
      <div className={clsx(
        'relative p-3 sm:p-4 font-semibold text-center group-hover:scale-105 group-hover:shadow-lg transition-all duration-500',
        theme === 'dark'
          ? model.color + ' text-white'
          : 'bg-[#23232b] text-white' // dark header in light mode
      )}>
        <button
          onClick={onRemove}
          className={clsx(
            "absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors",
            theme === 'dark' ? "hover:bg-white/20" : "hover:bg-black/10"
          )}
          title="Remove model"
        >
          <X size={16} />
        </button>
        <h3 className="text-base sm:text-lg font-bold">{model.displayName}</h3>
        <p className="text-xs sm:text-sm opacity-90">{model.provider}</p>
        <div className="flex flex-col items-center mt-2 gap-2">

        </div>

        {isBest && (
          <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2">
            <Award className="text-yellow-300" size={18} />
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className={clsx(
        "flex-1 p-3 sm:p-4 overflow-y-auto min-h-0 flex flex-col",
        theme === 'dark'
          ? "text-gray-200"
          : "bg-[#f7f7fa] text-gray-900"
      )}>
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400 py-10 sm:py-20 px-6 sm:px-16 w-full max-w-lg mx-auto">
              <div className="mb-8 sm:mb-12">
                {/* Enhanced Animated Circle */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-10">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1 animate-spin" style={{ animationDuration: '3s' }}>
                    <div className="w-full h-full rounded-full bg-gray-900/80 backdrop-blur-sm"></div>
                  </div>
                  {/* Inner gradient circle */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500/30 via-purple-500/40 to-pink-500/30 flex items-center justify-center animate-pulse">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl sm:text-2xl font-bold animate-bounce" style={{ animationDuration: '2s' }}>AI</span>
                    </div>
                  </div>
                  {/* Floating particles */}
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute top-1/2 -right-3 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
                </div>

                <p className={clsx(
                  "text-lg sm:text-2xl font-bold mb-3 sm:mb-4",
                  theme === 'dark' ? "text-gray-200" : "text-gray-700"
                )}>Ready to chat!</p>
                <p className={clsx(
                  "text-sm sm:text-base leading-relaxed mb-4 sm:mb-6",
                  theme === 'dark' ? "text-gray-300" : "text-gray-600"
                )}>{model.description}</p>
                <div className={clsx(
                  "text-xs opacity-80",
                  theme === 'dark' ? "text-gray-500" : "text-gray-500"
                )}>
                  Start a conversation to see responses from this AI model
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLoading={message.role === 'assistant' && isLoading && message === messages[messages.length - 1]}
                error={message.role === 'assistant' && error && message === messages[messages.length - 1] ? error : undefined}
                modelName={model.provider}
              />
            ))}
          </div>
        )}

        {/* Loading state for new message */}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex gap-3 p-3 sm:p-4 rounded-lg mb-3 bg-gray-800/60 border border-gray-600/50 shadow-lg">
            <div className="flex-shrink-0 relative">
              {/* Outer rotating ring */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-0.5 animate-spin">
                <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                  {/* Inner pulsing dot */}
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              {/* Orbiting dots */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
                <div className="absolute top-0 left-1/2 w-1 h-1 bg-blue-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDelay: '0.5s' }}>
                <div className="absolute top-1/2 right-0 w-1 h-1 bg-purple-400 rounded-full transform translate-x-1/2 -translate-y-1/2 animate-ping"></div>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-white text-xs sm:text-sm font-semibold mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {model.provider}
              </div>
              <div className="text-gray-300 text-sm flex items-center gap-2">
                <span className="animate-pulse">Thinking</span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={clsx(
        "p-3 sm:p-4 border-t flex gap-2 transition-colors duration-500",
        theme === 'dark'
          ? "border-[#27272a] bg-[#18181b] group-hover:bg-[#23232b]"
          : "border-[#e5e7eb] bg-[#f7f7fa] group-hover:bg-[#ececf1]"
      )}>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (lastAssistantMessage) {
                try {
                  await copyToClipboard(lastAssistantMessage.content);
                  setIsCopied(true);

                  if (copyTimeout) clearTimeout(copyTimeout);
                  const timeout = setTimeout(() => {
                    setIsCopied(false);
                    setCopyTimeout(null);
                  }, 2000);
                  setCopyTimeout(timeout);
                } catch (error) {
                  console.error('Failed to copy response:', error);
                }
              }
            }}
            disabled={!lastAssistantMessage}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md',
              theme === 'dark'
                ? (
                    lastAssistantMessage
                      ? isCopied
                        ? 'bg-green-600/50 hover:bg-green-600 text-green-300 shadow-lg'
                        : 'text-white shadow-lg hover:scale-110'
                      : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                  )
                : (
                    lastAssistantMessage
                      ? isCopied
                        ? 'bg-green-700 hover:bg-green-800 text-white shadow'
                        : 'bg-[#23232b] hover:bg-gray-900 text-white shadow'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )
            )}
            style={{
              background: theme === 'dark' && lastAssistantMessage && !isCopied
                ? model.color.includes('from-')
                  ? `linear-gradient(135deg, ${model.color.replace('from-', '').replace(' to-', ',').replace('-500', '')})`
                  : model.color
                : undefined
            }}
            title="Copy last response"
          >
            <Copy size={14} className="group-hover:rotate-12 transition-transform duration-300" />
            {isCopied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={onPickBest}
            disabled={!lastAssistantMessage}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md',
              theme === 'dark'
                ? (
                    isBest
                      ? 'text-white shadow-lg border-2'
                      : lastAssistantMessage
                        ? 'text-white shadow-lg hover:scale-110'
                        : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                  )
                : (
                    isBest
                      ? 'bg-blue-700 border-2 border-blue-400 text-white shadow'
                      : lastAssistantMessage
                        ? 'bg-[#23232b] hover:bg-gray-900 text-white shadow'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )
            )}
            style={{
              background: theme === 'dark' && lastAssistantMessage
                ? model.color.includes('from-')
                  ? `linear-gradient(135deg, ${model.color.replace('from-', '').replace(' to-', ',').replace('-500', '')})`
                  : model.color
                : undefined,
              borderColor: isBest && theme === 'dark'
                ? model.color.includes('from-')
                  ? model.color.replace('from-', '').replace(' to-', '').replace('-500', '').split(',')[0]
                  : model.color
                : undefined
            }}
            title={isBest ? 'Best response' : 'Pick as best'}
          >
            <Award size={14} className="group-hover:scale-110 transition-transform duration-300" />
            {isBest ? 'Best' : 'Pick best'}
          </button>
        </div>
      </div>
    </div>
  );
}
