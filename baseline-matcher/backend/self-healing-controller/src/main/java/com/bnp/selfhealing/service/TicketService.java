package com.bnp.selfhealing.service;

import com.bnp.selfhealing.dto.TicketRequest;
import com.bnp.selfhealing.entity.Department;
import com.bnp.selfhealing.entity.Ticket;
import com.bnp.selfhealing.entity.TicketAudit;
import com.bnp.selfhealing.repository.DepartmentRepository;
import com.bnp.selfhealing.repository.TicketAuditRepository;
import com.bnp.selfhealing.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketAuditRepository ticketAuditRepository;
    private final DepartmentRepository departmentRepository;

    public TicketService(
            TicketRepository ticketRepository,
            TicketAuditRepository ticketAuditRepository,
            DepartmentRepository departmentRepository) {

        this.ticketRepository = ticketRepository;
        this.ticketAuditRepository = ticketAuditRepository;
        this.departmentRepository = departmentRepository;
    }

    public Ticket createTicket(TicketRequest request) {

        Department department = departmentRepository
                .findByName(request.getDepartment())
                .orElseGet(() -> {
                    Department newDepartment = new Department();
                    newDepartment.setName(request.getDepartment());
                    return departmentRepository.save(newDepartment);
                });

        Ticket ticket = new Ticket();

        ticket.setDepartmentId(department.getId());
        ticket.setDescription(request.getDescription());
        ticket.setStatus("NEW");
        ticket.setCreatedAt(LocalDateTime.now());

        Ticket savedTicket = ticketRepository.save(ticket);

        TicketAudit audit = new TicketAudit();

        audit.setTicketId(savedTicket.getId());
        audit.setUserId(request.getRequestorId());
        audit.setAction("TICKET_CREATED");
        audit.setTimestamp(LocalDateTime.now());
        audit.setTicketHash(generateSha256(request.getDescription()));

        ticketAuditRepository.save(audit);

        return savedTicket;
    }

    private String generateSha256(String text) {

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hashBytes = digest.digest(
                    text.getBytes(StandardCharsets.UTF_8)
            );

            StringBuilder hexString = new StringBuilder();

            for (byte b : hashBytes) {
                hexString.append(String.format("%02x", b));
            }

            return hexString.toString();

        } catch (Exception e) {
            throw new RuntimeException("Unable to generate ticket hash", e);
        }
    }
}
