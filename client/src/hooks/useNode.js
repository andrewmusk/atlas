import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNode, updateNode, updateStatus, deleteNode } from '../api/atlas.js';

export function useNode(id) {
  return useQuery({
    queryKey: ['node', id],
    queryFn: () => getNode(id),
    enabled: !!id,
  });
}

export function useUpdateNode(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateNode(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(['node', id], updated);
    },
  });
}

export function useUpdateStatus(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateStatus(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(['node', id], (old) => old ? { ...old, status: updated.status } : old);
      // Invalidate to refresh full node with new changelog
      qc.invalidateQueries({ queryKey: ['node', id] });
    },
  });
}

export function useDeleteNode(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteNode(id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['node', id] });
    },
  });
}
