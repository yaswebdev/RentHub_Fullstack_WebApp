package com.renthub;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@Disabled("Requires running PostgreSQL — use integration test profile")
@SpringBootTest(properties = "app.jwt.secret=test-jwt-secret-for-tests-only-32chars")
class RenthubBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
