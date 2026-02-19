import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNodeChats, createChat, getChat, postChatMessage, streamChatAiResponse } from '../api/atlas.js';

/**
 * List all chats for a node.
 */
export function useChats(nodeId) {
  return useQuery({
    queryKey: ['chats', nodeId],
    queryFn: () => getNodeChats(nodeId),
    enabled: !!nodeId,
  });
}

/**
 * Create a new chat for a node.
 */
export function useCreateChat(nodeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createChat(nodeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chats', nodeId] });
    },
  });
}

/**
 * Manage a single chat: messages, streaming, and proposals.
 */
export function useChat(chatId) {
  const qc = useQueryClient();
  const [streamingMessage, setStreamingMessage] = useState(null);
  const [proposals, setProposals] = useState([]);

  // Clear ephemeral state when switching chats
  useEffect(() => {
    setStreamingMessage(null);
    setProposals([]);
  }, [chatId]);

  const query = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => getChat(chatId),
    enabled: !!chatId,
  });

  const sendMessage = useCallback(
    async ({ content, author, authorType, sessionId }) => {
      const msg = await postChatMessage(chatId, { content, author, authorType, sessionId });
      qc.setQueryData(['chat', chatId], (old) => {
        if (!old) return old;
        return { ...old, messages: [...old.messages, msg] };
      });
      return msg;
    },
    [chatId, qc]
  );

  const sendAiMessage = useCallback(
    async ({ content, author, authorType, sessionId }) => {
      // Optimistically show human message
      const optimisticHuman = {
        id: `temp-${Date.now()}`,
        chatId,
        role: 'user',
        authorLabel: author,
        authorType,
        content,
        createdAt: new Date().toISOString(),
      };

      qc.setQueryData(['chat', chatId], (old) => {
        if (!old) return old;
        return { ...old, messages: [...old.messages, optimisticHuman] };
      });

      setProposals([]);
      setStreamingMessage({ content: '' });

      try {
        const body = await streamChatAiResponse(chatId, content, author, authorType, sessionId);
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') {
              setStreamingMessage(null);
              // Refresh the full thread to get the persisted AI message
              qc.invalidateQueries({ queryKey: ['chat', chatId] });
              qc.invalidateQueries({ queryKey: ['chats'] }); // update last message preview
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                accumulated += parsed.token;
                setStreamingMessage({ content: accumulated });
              } else if (parsed.type === 'proposal') {
                setProposals((prev) => [...prev, parsed.proposal]);
              }
            } catch {}
          }
        }
      } catch (err) {
        setStreamingMessage(null);
        console.error('Stream error:', err);
        throw err;
      }
    },
    [chatId, qc]
  );

  return { ...query, streamingMessage, proposals, sendMessage, sendAiMessage };
}
