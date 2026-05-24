import { config } from './config/env.js';
import app from './app.js';

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT} [${config.NODE_ENV}]`);
});
