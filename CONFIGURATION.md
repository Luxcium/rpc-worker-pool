# RPC Worker Pool Configuration Guide

## Configuration Sources

The RPC Worker Pool system uses a hierarchical configuration system with the following priority order (highest to lowest):

1. Command Line Arguments
2. Environment Variables
3. Configuration Files
4. Default Values

## Configuration Options

### Worker Pool Configuration

```typescript
interface WorkerPoolConfig {
  // Core Settings
  poolSize: number;                 // Number of workers in the pool
  taskTimeout: number;              // Task execution timeout in milliseconds
  retryAttempts: number;           // Number of retry attempts for failed tasks
  maxQueueSize: number;            // Maximum number of queued tasks

  // Worker Options
  workerOptions: {
    resourceLimits: {
      maxOldGenerationSizeMb: number;  // Max old generation size in MB
      maxYoungGenerationSizeMb: number; // Max young generation size in MB
    };
  };

  // Monitoring
  enableMetrics: boolean;          // Enable performance metrics collection
  metricsInterval: number;         // Metrics collection interval in milliseconds
}
```

### Pipeline Configuration

```typescript
interface PipelineConfig {
  // Stage Configuration
  stages: {
    maxStages: number;             // Maximum number of pipeline stages
    validateStages: boolean;       // Enable stage validation
    stageTimeout: number;          // Individual stage timeout
  };

  // Error Handling
  errorHandling: {
    retryEnabled: boolean;         // Enable stage retry on failure
    maxRetries: number;           // Maximum retry attempts per stage
    failFast: boolean;            // Stop pipeline on first error
  };

  // Performance
  performance: {
    bufferSize: number;           // Stage buffer size
    concurrentStages: boolean;    // Enable concurrent stage execution
    batchSize: number;           // Batch size for processing
  };
}
```

## Configuration Methods

### 1. Command Line Arguments

```bash
# Core Settings
--pool-size=4                      # Set worker pool size
--task-timeout=30000               # Set task timeout (ms)
--retry-attempts=3                 # Set retry attempts
--max-queue-size=1000             # Set max queue size

# Worker Options
--max-old-gen=512                 # Set max old generation size (MB)
--max-young-gen=256               # Set max young generation size (MB)

# Monitoring
--enable-metrics                  # Enable metrics collection
--metrics-interval=5000           # Set metrics interval (ms)
```

### 2. Environment Variables

```bash
# Core Settings
RPC_POOL_SIZE=4
RPC_TASK_TIMEOUT=30000
RPC_RETRY_ATTEMPTS=3
RPC_MAX_QUEUE_SIZE=1000

# Worker Options
RPC_MAX_OLD_GEN=512
RPC_MAX_YOUNG_GEN=256

# Monitoring
RPC_ENABLE_METRICS=true
RPC_METRICS_INTERVAL=5000

# Pipeline Settings
RPC_MAX_STAGES=10
RPC_STAGE_TIMEOUT=5000
RPC_ENABLE_STAGE_RETRY=true
```

### 3. Configuration File (config.json)

```json
{
  "workerPool": {
    "poolSize": 4,
    "taskTimeout": 30000,
    "retryAttempts": 3,
    "maxQueueSize": 1000,
    "workerOptions": {
      "resourceLimits": {
        "maxOldGenerationSizeMb": 512,
        "maxYoungGenerationSizeMb": 256
      }
    },
    "monitoring": {
      "enableMetrics": true,
      "metricsInterval": 5000
    }
  },
  "pipeline": {
    "stages": {
      "maxStages": 10,
      "validateStages": true,
      "stageTimeout": 5000
    },
    "errorHandling": {
      "retryEnabled": true,
      "maxRetries": 3,
      "failFast": false
    },
    "performance": {
      "bufferSize": 1000,
      "concurrentStages": true,
      "batchSize": 100
    }
  }
}
```

## Docker Configuration

### Environment File (.env)

```bash
# Worker Pool Configuration
RPC_POOL_SIZE=4
RPC_TASK_TIMEOUT=30000
RPC_RETRY_ATTEMPTS=3
RPC_MAX_QUEUE_SIZE=1000

# Resource Limits
RPC_MAX_OLD_GEN=512
RPC_MAX_YOUNG_GEN=256

# Monitoring
RPC_ENABLE_METRICS=true
RPC_METRICS_INTERVAL=5000
```

### Docker Compose Configuration

```yaml
version: '3.8'
services:
  rpc-worker-pool:
    build: .
    env_file: .env
    environment:
      NODE_ENV: production
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 2G
        reservations:
          cpus: '2'
          memory: 1G
```

## Default Configuration

The system provides sensible defaults for all configuration options:

```typescript
const defaultConfig: WorkerPoolConfig = {
  poolSize: 4,
  taskTimeout: 30000,
  retryAttempts: 3,
  maxQueueSize: 1000,
  workerOptions: {
    resourceLimits: {
      maxOldGenerationSizeMb: 512,
      maxYoungGenerationSizeMb: 256
    }
  },
  enableMetrics: false,
  metricsInterval: 5000
};

const defaultPipelineConfig: PipelineConfig = {
  stages: {
    maxStages: 10,
    validateStages: true,
    stageTimeout: 5000
  },
  errorHandling: {
    retryEnabled: true,
    maxRetries: 3,
    failFast: false
  },
  performance: {
    bufferSize: 1000,
    concurrentStages: true,
    batchSize: 100
  }
};
```

## Configuration Best Practices

1. **Environment-Specific Configuration**
   - Use different configuration files for development, testing, and production
   - Override sensitive values using environment variables
   - Document all configuration changes

2. **Resource Management**
   - Set appropriate memory limits based on system resources
   - Configure worker pool size based on CPU cores
   - Adjust queue sizes based on expected load

3. **Error Handling**
   - Configure appropriate retry attempts
   - Set reasonable timeouts
   - Enable detailed error logging in development

4. **Performance Tuning**
   - Adjust batch sizes based on workload
   - Configure concurrent processing appropriately
   - Monitor and adjust buffer sizes as needed

5. **Monitoring**
   - Enable metrics in production
   - Set appropriate collection intervals
   - Configure alerting thresholds

## Configuration Validation

The system validates all configuration values:

```typescript
interface ConfigValidation {
  required: boolean;
  type: 'number' | 'boolean' | 'string';
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

const configValidation: Record<keyof WorkerPoolConfig, ConfigValidation> = {
  poolSize: { required: true, type: 'number', minimum: 1 },
  taskTimeout: { required: true, type: 'number', minimum: 1000 },
  retryAttempts: { required: true, type: 'number', minimum: 0 },
  maxQueueSize: { required: true, type: 'number', minimum: 100 },
  // ... additional validation rules
};
```

## Configuration Updates

The system supports dynamic configuration updates for certain parameters:

```typescript
// Update pool size at runtime
await pool.updateConfig({
  poolSize: 8
});

// Update task timeout
await pool.updateConfig({
  taskTimeout: 60000
});
```

Note: Some configuration changes require a system restart to take effect.
