import { MOCK_TICKETS } from './mockData';

// Helper to normalize backend ticket object into frontend expected format
function mapBackendTicket(t) {
  if (!t) return null;
  return {
    id: t.id,
    department: t.department_name || t.department_id,
    description: t.description,
    score: t.match_score !== undefined && t.match_score !== null ? t.match_score : null,
    status: t.status || 'NEW',
    rawSha256: t.raw_sha256,
    requestorId: t.requestor_id,
    requestorGeography: t.requestor_geography,
    priority: t.priority,
    article: t.matched_article ? {
      id: t.matched_article.id,
      title: t.matched_article.title,
      content: t.matched_article.body_text,
      matchingFragments: (t.highlighted_sentences || []).map((h) => h.sentence),
    } : null,
    questions: t.clarification_questions || [],
    createdAt: t.created_at,
    attachmentName: t.attachment_filename,
    overrideNote: t.override_note,
  };
}

export async function getTickets(department) {
  try {
    const url = department && department !== 'All' 
      ? `/api/tickets?department_id=${encodeURIComponent(department)}`
      : '/api/tickets';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.map(mapBackendTicket);
  } catch (err) {
    console.warn('Backend tickets endpoint error, using local fallback:', err);
    if (department && department !== 'All') {
      return MOCK_TICKETS.filter((t) => t.department === department);
    }
    return MOCK_TICKETS;
  }
}

export async function getTicketById(id) {
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return mapBackendTicket(data);
  } catch (err) {
    console.warn('Backend ticket by ID error, checking local fallback:', err);
    return MOCK_TICKETS.find((t) => t.id === id) || null;
  }
}

export async function createTicket({ department, description, requestorId, attachment }) {
  try {
    const payload = {
      department_id: department,
      description,
      requestor_id: requestorId,
      priority: 'Medium',
    };
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return mapBackendTicket(data);
  } catch (err) {
    console.warn('Backend createTicket error, fallback:', err);
    const mock = {
      id: `TICK-${Date.now().toString(16).slice(-4).toUpperCase()}`,
      department,
      description,
      requestorId,
      score: 95,
      status: 'NEW',
      article: null,
      questions: [],
      createdAt: new Date().toISOString(),
      attachmentName: attachment ? attachment.name : null,
    };
    return mock;
  }
}

export async function selfHeal(id) {
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}/self-heal`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await getTicketById(id);
  } catch (err) {
    console.warn('Backend selfHeal error:', err);
    return await getTicketById(id);
  }
}

export async function overrideTicket(id, note) {
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ override_note: note }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return mapBackendTicket(data);
  } catch (err) {
    console.warn('Backend override error:', err);
    return await getTicketById(id);
  }
}

export async function askMore(id, answers) {
  try {
    const answerList = Array.isArray(answers)
      ? answers
      : typeof answers === 'object' && answers !== null
      ? Object.values(answers).filter(Boolean)
      : [String(answers)];
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}/ask-more`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: answerList }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return mapBackendTicket(data);
  } catch (err) {
    console.warn('Backend askMore error:', err);
    return await getTicketById(id);
  }
}

export async function escalateTicket(id) {
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}/escalate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return mapBackendTicket(data);
  } catch (err) {
    console.warn('Backend escalate error:', err);
    return await getTicketById(id);
  }
}