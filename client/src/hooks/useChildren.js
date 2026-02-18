import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChildren, createNode } from '../api/atlas.js';

export function useChildren(parentId, type) {
  return useQuery({
    queryKey: ['children', parentId, type],
    queryFn: () => getChildren(parentId, type),
    enabled: !!parentId,
  });
}

export function useCreateNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createNode,
    onSuccess: (node) => {
      // Invalidate the parent's children list
      if (node.parentId) {
        qc.invalidateQueries({ queryKey: ['children', node.parentId] });
      }
      // Also invalidate projects list if it's a project
      if (node.type === 'project') {
        qc.invalidateQueries({ queryKey: ['projects'] });
      }
    },
  });
}
