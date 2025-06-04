// WebSocket 测试工具
export const testWebSocketConnection = () => {
  return new Promise((resolve, reject) => {
    let websocket;
    const clientId = Math.random().toString(36).substr(2);
    
    try {
      // 根据环境选择不同的 WebSocket 地址
      const isDev = import.meta.env.DEV;
      let wsUrl;
      
      if (isDev) {
        // 开发环境：使用 Vite 代理
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        wsUrl = `${protocol}//${host}/ws/${clientId}`;
      } else {
        // 生产环境：直接连接后端
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = '10.252.146.143:8080';
        wsUrl = `${protocol}//${host}/ws/${clientId}`;
      }
      
      console.log('Testing WebSocket connection to:', wsUrl);
      websocket = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        websocket.close();
        reject(new Error('WebSocket connection timeout'));
      }, 10000); // 10秒超时
      
      websocket.onopen = () => {
        clearTimeout(timeout);
        console.log('WebSocket connection successful!');
        websocket.close();
        resolve('连接成功');
      };
      
      websocket.onerror = (error) => {
        clearTimeout(timeout);
        console.error('WebSocket connection failed:', error);
        reject(new Error('WebSocket 连接失败'));
      };
      
      websocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
      };
      
    } catch (error) {
      console.error('WebSocket test error:', error);
      reject(error);
    }
  });
}; 