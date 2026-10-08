

package com.bnp.selfhealing.repository;

import com.bnp.selfhealing.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
}
