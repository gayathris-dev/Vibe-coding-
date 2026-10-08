package com.bnp.selfhealing.repository;

import com.bnp.selfhealing.entity.TicketAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketAuditRepository extends JpaRepository<TicketAudit, Long> {
}
