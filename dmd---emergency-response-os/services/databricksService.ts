
const API_HOST = "adb-1316013218156597.17.azuredatabricks.net";
const API_PATH = "/sql/1.0/warehouses/46bbeb09bd335b02";
const API_TOKEN = "dapi0fbe60b5ee8cafa63351de4b32f8cd27";

/**
 * [수정된 버전] 프론트엔드 전용 우회(Proxy) 연결 함수
 * Databricks SQL Execution API (2.0) Calling Function
 */
export const executeDatabricksQuery = async (query: string) => {
  try {
    // 1. Databricks 주소 정리
    let host = API_HOST;
    if (!host.startsWith("https://")) {
      host = `https://${host}`;
    }

    const warehouseId = API_PATH.split('/').pop();
    // 원래 가려던 목적지 (Databricks)
    const targetUrl = `${host}/api/2.0/sql/statements`;
    
    // ⭐️ 핵심: 코드로 우회 도로(Proxy) 설정 ⭐️
    // 이 주소를 거치면 CORS 에러가 사라집니다.
    const proxyUrl = "https://corsproxy.io/?"; 
    const finalUrl = proxyUrl + encodeURIComponent(targetUrl);

    console.log("🚀 Proxy 타고 출발:", finalUrl);

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statement: query,
        warehouse_id: warehouseId,
        wait_timeout: "30s",
        on_wait_timeout: "CANCEL",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Proxy가 에러를 뱉을 때도 있어서 체크
      throw new Error(`Databricks/Proxy 에러: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result;

  } catch (error: any) {
    console.error("❌ 에러 발생:", error);
    throw error;
  }
};

/**
 * Fetches the AI analysis report for a specific patient from Databricks
 */
export const fetchAiAnalysis = async (patientId: string): Promise<string> => {
  const sql = `SELECT analysis_report FROM 2dt_2nd_team6_group.dmd_ai.openai_results WHERE patient_id = '${patientId}' LIMIT 1`;
  
  try {
    const result = await executeDatabricksQuery(sql);
    
    if (result?.result?.data_array && result.result.data_array.length > 0) {
      return result.result.data_array[0][0];
    }
    
    return `환자(${patientId})의 분석 결과가 데이터베이스(openai_results)에 존재하지 않습니다.`;
  } catch (e) {
    console.warn("Fetch AI Analysis failed, likely CORS or Proxy issue.", e);
    return "실제 DB 연결에 실패했습니다. 데모를 위해 브라우저의 CORS 제한 해제 확장 프로그램 사용을 권장합니다.";
  }
};

/**
 * Logs A/B test duration results to the Databricks 'ab_test_logs' table.
 */
export const logAbTestResult = async (patientId: string, group: string, duration: number): Promise<void> => {
  const sql = `INSERT INTO 2dt_2nd_team6_group.dmd_ai.ab_test_logs (patient_id, group_type, duration, created_at) 
               VALUES ('${patientId}', '${group}', ${duration}, current_timestamp())`;
  
  try {
    const result = await executeDatabricksQuery(sql);
    if (result?.status?.state === "SUCCEEDED" || result?.statement_id) {
      console.log(`📊 [DB 기록 성공] Databricks Catalog 업데이트 완료: ${patientId}, ${duration}s`);
    }
    saveToLocalLogs(patientId, group, duration, "SUCCESS");
  } catch (e) {
    console.group("📊 [DB 기록 우회] 네트워크 제한으로 인해 로컬에만 저장합니다.");
    saveToLocalLogs(patientId, group, duration, "LOCAL_ONLY");
    console.groupEnd();
  }
};

const saveToLocalLogs = (patientId: string, group: string, duration: number, status: string) => {
  try {
    const existingLogs = JSON.parse(localStorage.getItem('dmd_ab_logs') || '[]');
    const newLog = {
      patientId,
      group,
      duration,
      status,
      timestamp: new Date().toLocaleString()
    };
    existingLogs.push(newLog);
    localStorage.setItem('dmd_ab_logs', JSON.stringify(existingLogs));
  } catch (e) {
    console.error("Local storage error:", e);
  }
};

// [추가] AI 요약 데이터(JSON) 가져오기 (Group B 전용)
export const fetchAiSummary = async (patientId: string) => {
  const query = `
    SELECT summary 
    FROM judge.silver.correction_summary_results 
    WHERE patient_id = '${patientId}' 
    ORDER BY processed_at DESC 
    LIMIT 1
  `;
  
  return await executeDatabricksQuery(query);
};
