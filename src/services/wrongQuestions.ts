export interface WrongQuestion {
  id: string;
  question: string;
  answer: string;
  agent: string;
  agentKey: string;
  time: string;
}

const STORAGE_KEY = 'tutor_wrong_questions';

export function getWrongQuestions(): WrongQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWrongQuestion(item: WrongQuestion): void {
  const questions = getWrongQuestions();
  questions.unshift(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

export function deleteWrongQuestion(id: string): void {
  const questions = getWrongQuestions().filter(q => q.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

export function clearWrongQuestions(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}
