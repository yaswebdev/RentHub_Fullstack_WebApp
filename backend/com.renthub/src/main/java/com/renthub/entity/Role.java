package com.renthub.entity;

/**
 * Type-safe role enum. Maps to the VARCHAR role column in the users table.
 * Stored as the enum name string (e.g., "ADMIN", "HOTE", "LOCATAIRE").
 */
public enum Role {
    ADMIN,
    HOTE,
    LOCATAIRE
}
