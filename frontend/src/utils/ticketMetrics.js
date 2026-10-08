import { getWorkflowStage } from './workflow';

// All four KPIs derive purely from the existing mock ticket data and the
// existing getWorkflowStage() logic — nothing here invents backend
// functionality or new fields.
export function computeTicketMetrics(tickets = []) {
  let newCount = 0;
  let selfHealedCount = 0;
  let awaitingAnalystAction = 0;
  let escalatedCount = 0;

  tickets.forEach((ticket) => {
    if (ticket.status === 'NEW') newCount += 1;
    if (ticket.status === 'SELF_HEALED') selfHealedCount += 1;
    if (ticket.status === 'ESCALATED') escalatedCount += 1;

    const hasScore = ticket.score !== null && ticket.score !== undefined;

    if (hasScore && ticket.status === 'NEW') {
      const stage = getWorkflowStage(ticket.score);

      if (stage === 'OVERRIDE' || stage === 'ASK_MORE') {
        awaitingAnalystAction += 1;
      }
      if (stage === 'ESCALATE') {
        escalatedCount += 1;
      }
    }
  });

  return { newCount, selfHealedCount, awaitingAnalystAction, escalatedCount };
}