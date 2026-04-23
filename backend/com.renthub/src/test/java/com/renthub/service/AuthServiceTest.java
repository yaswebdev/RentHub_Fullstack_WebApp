package com.renthub.service;

import com.renthub.dto.AuthResponse;
import com.renthub.dto.LoginRequest;
import com.renthub.dto.RegisterRequest;
import com.renthub.entity.Role;
import com.renthub.entity.User;
import com.renthub.repository.UserRepository;
import com.renthub.security.JwtUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerShouldCreateUserAndReturnToken() {
        RegisterRequest req = new RegisterRequest();
        req.setNom("Yassine");
        req.setEmail("yassine@example.com");
        req.setPassword("secret123");
        req.setRole("hote");

        User savedUser = new User();
        savedUser.setId(1);
        savedUser.setNom("Yassine");
        savedUser.setEmail("yassine@example.com");
        savedUser.setPassword("encoded-secret");
        savedUser.setRole(Role.HOTE);

        when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(req.getPassword())).thenReturn("encoded-secret");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtils.generateToken(savedUser.getEmail())).thenReturn("jwt-token");

        AuthResponse response = authService.register(req);

        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals(1, response.getUser().getId());
        assertEquals("HOTE", response.getUser().getRole());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void registerShouldThrowWhenEmailAlreadyExists() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("existing@example.com");

        when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.of(new User()));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.register(req));
        assertEquals("Cet email est déjà utilisé", ex.getMessage());
        verify(userRepository, times(0)).save(any(User.class));
    }

    @Test
    void loginShouldAuthenticateAndReturnToken() {
        LoginRequest req = new LoginRequest();
        req.setEmail("yassine@example.com");
        req.setPassword("secret123");

        User user = new User();
        user.setId(5);
        user.setNom("Yassine");
        user.setEmail("yassine@example.com");
        user.setRole(Role.LOCATAIRE);

        when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.of(user));
        when(jwtUtils.generateToken(user.getEmail())).thenReturn("jwt-login");

        AuthResponse response = authService.login(req);

        assertNotNull(response);
        assertEquals("jwt-login", response.getToken());
        assertEquals(5, response.getUser().getId());
        verify(authenticationManager, times(1)).authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );
    }

    @Test
    void loginShouldThrowWhenUserNotFound() {
        LoginRequest req = new LoginRequest();
        req.setEmail("missing@example.com");
        req.setPassword("secret123");

        when(userRepository.findByEmail(req.getEmail())).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.login(req));
        assertEquals("Utilisateur non trouvé", ex.getMessage());
    }
}
