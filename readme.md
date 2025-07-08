# byteplus-vke

This is sample codebase using BytePlus VKE API to setup VKE Cluster

## Current supported API
- createAddon (need validated)
- createCluster
- createKubeConfig
- createNodePool
- deleteNodePool
- listClusters
- listKubeConfigs
- listSupportECS
- listSupportedAddons

## How to call API
- install node module
- node src/api/{api.ts} -> call certain VKE API

## Thing to Reminder
- Copy cred/index_template.ts as src/cred/index.ts
- Insert your given IAM account access key into src/cred/index.ts for allow BytePlus API function as usual
- Make sure your given IAM has enough permission to access BytePlus VKE