async function fetchBoards() {
  const data = await apiFetch('/boards');
  return data.items ?? data;
}

async function createBoard(name, description) {
  return apiFetch('/boards', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

async function deleteBoard(boardId) {
  return apiFetch(`/boards/${boardId}`, { method: 'DELETE' });
}

async function fetchMe() {
  return apiFetch('/users/me');
}
