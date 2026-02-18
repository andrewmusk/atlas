import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChat, postMessage, streamAiResponse } from '../api/atlas.js';

export function useChat(nodeId) {
  const qc = useQueryClient();
  const [streamingMessage, setStreamingMessage] = useState(null); // { content: string } while streaming

  const query = useQuery({
    queryKey: ['chat', nodeId],
    queryFn: () => getChat(nodeId),
    enabled: !!nodeId,
  });

  const sendMessage = useCallback(
    async ({ content, author, authorType, sessionId }) => {
      const msg = await postMessage(nodeId, { content, author, authorType, sessionId });
      qc.setQueryData(['chat', nodeId], (old) => {
        if (!old) return old;
        return { ...old, messages: [...old.messages, msg] };
      });
      return msg;
    },
    [nodeId, qc]
  );

  const sendAiMessage = useCallback(
    async ({ content, author, authorType, sessionId }) => {
      // Optimistically show human message
      const optimisticHuman = {
        id: `temp-${Date.now()}`,
        nodeId,
        role: 'user',
        authorLabel: author,
        authorType,
        content,
        createdAt: new Date().toISOString(),
      };

      qc.setQueryData(['chat', nodeId], (old) => {
        if (!old) return old;
        return { ...old, messages: [...old.messages, optimisticHuman] };
      });

      setStreamingMessage({ content: '' });

      try {
        const body = await streamAiResponse(nodeId, content, author, authorType, sessionId);
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
              qc.invalidateQueries({ queryKey: ['chat', nodeId] });
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                accumulated += parsed.token;
                setStreamingMessage({ content: accumulated });
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
    [nodeId, qc]
  );

  return { ...query, streamingMessage, sendMessage, sendAiMessage };
}
