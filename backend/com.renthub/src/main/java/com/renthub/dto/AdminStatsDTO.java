package com.renthub.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AdminStatsDTO {
    private long totalUsers;
    private long totalAnnonces;
    private long totalReservations;
    private BigDecimal totalRevenue;
    private long totalMessages;
    private long activeListings;
}
