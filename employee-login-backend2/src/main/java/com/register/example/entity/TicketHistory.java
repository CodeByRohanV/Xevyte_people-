package com.register.example.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "helpdesk_ticket_history")
public class TicketHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long ticketId;          // Which ticket
    private String actionType;      // ASSIGNED, TRANSFERRED, REASSIGNED, RESOLVED, REOPENED, MANAGER_APPROVED, MANAGER_REJECTED
   @Column(name = "from_team", length = 50)
private String fromTeam;

@Column(name = "from_user", length = 50)
private String fromUser;

@Column(name = "to_team", length = 50)
private String toTeam;

@Column(name = "to_user", length = 50)
private String toUser;   

@Column(name = "actor_name", length = 50)
private String actorName;      // new team
    

    @Column(length = 2000)
    private String notes;           // reason or comment

    @Temporal(TemporalType.TIMESTAMP)
    private Date timestamp = new Date(); // Auto timestamp

    // =========================
    // GETTERS & SETTERS
    // =========================
    
    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public Long getId() { 
        return id; 
    }
    
    public void setId(Long id) { 
        this.id = id; 
    }

    public Long getTicketId() { 
        return ticketId; 
    }
    
    public void setTicketId(Long ticketId) { 
        this.ticketId = ticketId; 
    }

    public String getActionType() { 
        return actionType; 
    }
    
    public void setActionType(String actionType) { 
        this.actionType = actionType; 
    }

    public String getFromUser() { 
        return fromUser; 
    }
    
    public void setFromUser(String fromUser) { 
        this.fromUser = fromUser; 
    }

    public String getToUser() { 
        return toUser; 
    }
    
    public void setToUser(String toUser) { 
        this.toUser = toUser; 
    }

    public String getFromTeam() { 
        return fromTeam; 
    }
    
    public void setFromTeam(String fromTeam) { 
        this.fromTeam = fromTeam; 
    }

    public String getToTeam() { 
        return toTeam; 
    }
    
    public void setToTeam(String toTeam) { 
        this.toTeam = toTeam; 
    }

    public String getNotes() { 
        return notes; 
    }
    
    public void setNotes(String notes) { 
        this.notes = notes; 
    }

    public Date getTimestamp() { 
        return timestamp; 
    }
    
    public void setTimestamp(Date timestamp) { 
        this.timestamp = timestamp; 
    }
}
