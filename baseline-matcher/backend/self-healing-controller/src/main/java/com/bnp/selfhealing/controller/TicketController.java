package com.bnp.selfhealing.controller;

import com.bnp.selfhealing.dto.TicketRequest;
import com.bnp.selfhealing.entity.Ticket;
import com.bnp.selfhealing.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    public ResponseEntity<Ticket> createTicket(
            @Valid @RequestBody TicketRequest request) {

        Ticket ticket = ticketService.createTicket(request);

        return ResponseEntity.ok(ticket);
    }
}