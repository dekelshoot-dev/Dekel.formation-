import { spawn } from "child_process";
import http from "http";

// Comprehensive End-to-End Test Suite for Dekel.Formation Webhook and API System
const BASE_URL = "http://localhost:3000";

// Helper to make HTTP requests in raw Node.js to avoid external dependency issues
function request(
  method: string,
  path: string,
  body?: string | object,
  headers: Record<string, string> = {}
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const dataString = body 
      ? (typeof body === "string" ? body : JSON.stringify(body)) 
      : "";

    const parsedUrl = new URL(url);
    const options: http.RequestOptions = {
      method,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (body) {
      options.headers!["Content-Length"] = Buffer.byteLength(dataString);
    }

    const req = http.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : null;
          resolve({ status: res.statusCode || 0, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode || 0, data: responseData });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (body) {
      req.write(dataString);
    }
    req.end();
  });
}

// Visual formatting helpers
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  bgBlack: "\x1b[40m",
};

function printHeader(title: string) {
  console.log("\n" + colors.bright + colors.cyan + "=".repeat(70));
  console.log(` 🚀 ${title}`);
  console.log("=".repeat(70) + colors.reset);
}

function printSuccess(message: string) {
  console.log(`  ${colors.green}✔ ${message}${colors.reset}`);
}

function printFailure(message: string, errorDetails?: any) {
  console.log(`  ${colors.red}✘ ${message}${colors.reset}`);
  if (errorDetails) {
    console.log(`    ${colors.dim}${JSON.stringify(errorDetails, null, 2)}${colors.reset}`);
  }
}

function printStep(stepName: string) {
  console.log(`\n${colors.bright}${colors.blue}👉 Test Case: ${stepName}${colors.reset}`);
}

async function runTests() {
  printHeader("DEKEL.FORMATION - END-TO-END AUTOMATED TEST SUITE");
  
  let successCount = 0;
  let totalCount = 0;

  async function assertTest(
    name: string,
    action: () => Promise<{ status: number; expectedStatus: number; data?: any; validation?: (data: any) => boolean }>
  ) {
    totalCount++;
    printStep(name);
    try {
      const res = await action();
      if (res.status === res.expectedStatus) {
        if (!res.validation || res.validation(res.data)) {
          printSuccess(`PASS: Reçu le statut attendu ${res.status}`);
          successCount++;
        } else {
          printFailure(`FAIL: La validation personnalisée de la réponse a échoué`, res.data);
        }
      } else {
        printFailure(`FAIL: Attendu le statut ${res.expectedStatus}, reçu ${res.status}`, res.data);
      }
    } catch (e: any) {
      printFailure(`FAIL: Une erreur s'est produite lors de la requête`, e.message || e);
    }
  }

  // TEST 1: Check Server Accessibility / Health
  await assertTest("1. Disponibilité et accessibilité du serveur", async () => {
    // We try to ping the sync-enrollments API
    const res = await request("GET", "/api/sync-enrollments");
    return {
      status: res.status,
      expectedStatus: 200,
      data: res.data,
      validation: (data) => data && Array.isArray(data.enrollments),
    };
  });

  // TEST 2: SyntaxError interceptor (broken JSON structure)
  await assertTest("2. Intercepteur de syntaxe JSON malformée (Code 400)", async () => {
    // Send raw malformed JSON string (unclosed brace)
    const res = await request("POST", "/api/webhooks/payment/c-1", '{"email": "test@domain.com", "name": "Test"', {
      "Content-Type": "application/json"
    });
    return {
      status: res.status,
      expectedStatus: 400,
      data: res.data,
      validation: (data) => data && data.status === "error" && data.error.includes("Unexpected end of JSON input"),
    };
  });

  // TEST 3: Access Denied for Unknown Course ID
  await assertTest("3. Accès refusé pour un ID de formation inconnu (Code 401)", async () => {
    const res = await request("POST", "/api/webhooks/payment/unknown-course-id", {
      email: "eleve-test@gmail.com",
      name: "Eleve Test",
    });
    return {
      status: res.status,
      expectedStatus: 401,
      data: res.data,
      validation: (data) => data && data.status === "error" && data.error === "Unauthorized target resource",
    };
  });

  // TEST 4: Empty payload error handling
  await assertTest("4. Rejet d'une charge utile vide (Code 400)", async () => {
    const res = await request("POST", "/api/webhooks/payment/c-1", {});
    return {
      status: res.status,
      expectedStatus: 400,
      data: res.data,
      validation: (data) => data && data.status === "error" && data.message.includes("empty"),
    };
  });

  // TEST 5: Missing student email attribute
  await assertTest("5. Rejet d'une requête sans adresse e-mail (Code 400)", async () => {
    const res = await request("POST", "/api/webhooks/payment/c-1", {
      name: "Jean Sans Email"
    });
    return {
      status: res.status,
      expectedStatus: 400,
      data: res.data,
      validation: (data) => data && data.status === "error" && data.error.includes("manquante"),
    };
  });

  // TEST 6: Invalid email format constraints
  await assertTest("6. Rejet d'une adresse e-mail syntaxiquement invalide (Code 400)", async () => {
    const res = await request("POST", "/api/webhooks/payment/c-1", {
      email: "invalid-email-format-test",
      name: "Jean Mauvais Format"
    });
    return {
      status: res.status,
      expectedStatus: 400,
      data: res.data,
      validation: (data) => data && data.status === "error" && data.error.includes("invalide"),
    };
  });

  // TEST 7: Successful Webhook Enrollment
  const randomEmail = `e2e-student-${Date.now()}@dekel-test.com`;
  await assertTest("7. Succès de l'inscription via webhook valide (Code 200)", async () => {
    const res = await request("POST", "/api/webhooks/payment/c-1", {
      email: randomEmail,
      name: "Étudiant E2E Succès",
    });
    return {
      status: res.status,
      expectedStatus: 200,
      data: res.data,
      validation: (data) => data && data.status === "success" && data.enrollmentId !== undefined,
    };
  });

  // TEST 8: Sync Pending Enrollments Engine
  await assertTest("8. Moteur de synchronisation client-serveur (/api/sync-enrollments)", async () => {
    const res = await request("GET", "/api/sync-enrollments");
    return {
      status: res.status,
      expectedStatus: 200,
      data: res.data,
      validation: (data) => {
        if (!data || !Array.isArray(data.enrollments)) return false;
        // The student we enrolled in Test 7 should be present in the unsynced list
        const found = data.enrollments.some((e: any) => e.studentEmail === randomEmail.toLowerCase());
        return found;
      },
    };
  });

  // TEST 9: Querying Webhook Logs for Course
  await assertTest("9. Consultation du journal d'appels webhook pour la formation", async () => {
    const res = await request("GET", "/api/webhooks/logs/c-1");
    return {
      status: res.status,
      expectedStatus: 200,
      data: res.data,
      validation: (data) => {
        if (!data || !Array.isArray(data.logs)) return false;
        // The log should contain entries
        return data.logs.length > 0;
      },
    };
  });

  // TEST 10: Cleaning up Webhook logs
  await assertTest("10. Suppression des historiques et logs de webhook", async () => {
    const res = await request("DELETE", "/api/webhooks/logs/c-1");
    return {
      status: res.status,
      expectedStatus: 200,
      data: res.data,
      validation: (data) => data && data.status === "success",
    };
  });

  // FINAL RECAP
  console.log("\n" + colors.bright + colors.cyan + "=".repeat(70));
  console.log(` 📊 BILAN DES TESTS END-TO-END`);
  console.log("=".repeat(70) + colors.reset);
  
  const successPercent = Math.round((successCount / totalCount) * 100);
  console.log(`  Tests réussis : ${colors.green}${successCount} / ${totalCount}${colors.reset} (${successPercent}%)`);
  
  if (successCount === totalCount) {
    console.log(`\n  ${colors.bright}${colors.green}🎉 TOUS LES TESTS E2E ONT RÉUSSI AVEC SUCCÈS !${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n  ${colors.bright}${colors.red}⚠️ CERTAINS TESTS ONT ÉCHOUÉ ! VEUILLEZ VÉRIFIER LES LOGS CI-DESSUS.${colors.reset}\n`);
    process.exit(1);
  }
}

// Start executing tests after a short delay
runTests().catch((err) => {
  console.error("Erreur critique d'exécution des tests:", err);
  process.exit(1);
});
