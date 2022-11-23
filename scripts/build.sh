#!/bin/sh

tsc --noEmit false --generateCpuProfile ./docker/dist/performance/last_build.cpuprofile || exit 1
