import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// Типы
interface Category {
  name: string;
  probability: number;
}

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  isLoading?: boolean;
  categories?: Category[];
  error?: string;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    const text = inputValue;
    if (!text || isLoading) return;

    // Генерируем уникальный ID для сообщения пользователя
    const userMessageId = `user-${Date.now()}`;
    const loadingMessageId = `loading-${Date.now()}`;

    // Добавляем сообщение пользователя
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        text,
        isUser: true,
        isLoading: false,
      },
    ]);

    setInputValue("");
    setIsLoading(true);

    // Добавляем загрузочное сообщение бота
    setMessages((prev) => [
      ...prev,
      {
        id: loadingMessageId,
        text: "",
        isUser: false,
        isLoading: true,
      },
    ]);

    try {
      const response = await axios.post<{ categories: Category[] }>(
        "http://80.253.19.93:8000/analyze",
        { text: text },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000, // Таймаут 10 секунд
        },
      );

      // Обновляем загрузочное сообщение на результат
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                isLoading: false,
                categories: response.data.categories,
              }
            : msg,
        ),
      );
    } catch (error) {
      let errorMessage = "Неизвестная ошибка";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Сервер вернул статус не 2xx
          errorMessage = `Ошибка ${error.response.status}: ${
            error.response.data.message || error.message
          }`;
        } else if (error.request) {
          // Нет ответа от сервера (CORS, сервер не доступен и т.п.)
          errorMessage = "Нет ответа от сервера. Проверьте подключение.";
        } else {
          // Ошибка при настройке запроса
          errorMessage = `Ошибка запроса: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Обновляем загрузочное сообщение на сообщение об ошибке
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                isLoading: false,
                error: errorMessage,
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-gray-50">
      {/* Левая рамка */}
      <div className="w-16 bg-indigo-50 md:w-32 lg:w-48"></div>
      {/* Основное содержимое */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-100 flex w-screen bg-white shadow-sm">
          <div className="mx-auto flex max-w-4xl justify-center px-6 py-6">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9 }}
              className="text-xl font-bold text-indigo-600 md:text-3xl"
            >
              Анализатор ценностей
            </motion.h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full flex-col items-center justify-center p-8 text-center"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      ease: "easeInOut",
                    }}
                    className="mb-6"
                  >
                    <svg
                      className="h-20 w-20 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </motion.div>
                  <h2 className="mb-2 text-2xl font-bold text-gray-700">
                    Добро пожаловать в Анализатор ценностей
                  </h2>
                  <p className="max-w-md text-gray-500">
                    Этот инструмент поможет вам понять, какие ценности
                    преобладают в ваших сообщениях. Просто введите текст и
                    отправьте его для анализа.
                  </p>
                </motion.div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                  >
                    {message.isUser ? (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="max-w-3xl rounded-2xl rounded-tr-none bg-indigo-600 p-4 text-white shadow-md"
                      >
                        {message.text}
                      </motion.div>
                    ) : message.isLoading ? (
                      <motion.div className="flex max-w-3xl items-center space-x-2 rounded-2xl rounded-tl-none bg-white p-4 shadow-md">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear",
                          }}
                          className="h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent"
                        />
                        <span>Анализируем...</span>
                      </motion.div>
                    ) : message.error ? (
                      <div className="max-w-3xl rounded-2xl rounded-tl-none bg-white p-4 text-red-500 shadow-md">
                        Ошибка: {message.error}
                      </div>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="w-md rounded-2xl rounded-tl-none bg-white p-6 shadow-md md:w-xl"
                      >
                        <h3 className="mb-3 text-lg font-bold text-indigo-600">
                          Найденные ценности:
                        </h3>
                        <div className="space-y-3">
                          {message.categories?.map((cat, i) => (
                            <div
                              key={i}
                              className="flex flex-col sm:flex-row sm:items-center"
                            >
                              <div className="w-full font-medium sm:w-64">
                                {cat.name}
                              </div>
                              <div className="mt-1 flex flex-1 items-center sm:mt-0">
                                <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-200">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${cat.probability}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="h-full bg-indigo-500"
                                  />
                                </div>
                                <div className="ml-2 w-12 text-right text-sm font-medium">
                                  {cat.probability.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="mx-auto max-w-4xl">
              <div className="relative">
                <motion.textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Введите текст для анализа..."
                  className="w-full resize-none rounded-xl border border-gray-300 p-4 pr-16 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  rows={3}
                  whileFocus={{
                    boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.3)",
                  }}
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="absolute right-3 bottom-3 rounded-lg bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  whileHover={{ scale: isLoading ? 1 : 1.1 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                    />
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  )}
                </motion.button>
              </div>
              <p className="mt-2 text-center text-xs text-gray-500">
                Нажмите Enter для отправки, Shift+Enter для перехода на новую
                строку
              </p>
            </div>
          </div>
        </main>
      </div>
      {/* Правая рамка */}
      <div className="w-16 bg-indigo-50 md:w-32 lg:w-48"></div>
    </div>
  );
}
