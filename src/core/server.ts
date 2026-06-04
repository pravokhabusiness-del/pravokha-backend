import app from './app';
import { config } from './config/env';

const PORT =  process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});
