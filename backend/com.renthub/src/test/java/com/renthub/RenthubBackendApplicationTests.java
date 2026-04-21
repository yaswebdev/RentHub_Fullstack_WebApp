package com.renthub;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "app.jwt.secret=test-jwt-secret-for-tests-only-32chars")
class RenthubBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
