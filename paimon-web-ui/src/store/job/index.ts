/* Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License. */

import type { ExecutionMode, JobDetails } from './type'
import type { Job, JobResultData } from '@/api/models/job/types/job'

export interface JobState {
  jobs: Record<string, JobDetails>
  jobLog?: string
}

export const useJobStore = defineStore({
  id: 'job',
  state: (): JobState => ({
    jobs: {},
    jobLog: '',
  }),
  persist: false,
  getters: {
    getJobDetails(state): (key: string) => JobDetails | undefined {
      return key => state.jobs[key]
    },
    getCurrentJob(state): (key: string) => Job | null {
      return key => state.jobs[key]?.job
    },
    getExecutionMode(state): (key: string) => string | undefined {
      return key => state.jobs[key]?.executionMode
    },
    getJobStatus(state): (key: string) => string {
      return (key) => {
        if (!state.jobs[key]) {
          return ''
        }
        return state.jobs[key].jobStatus
      }
    },
    getJobResultData(state): (key: string) => JobResultData | null {
      return key => state.jobs[key]?.jobResultData
    },
    getExecutionTime(state): (key: string) => string {
      return (key) => {
        if (!state.jobs[key]) {
          return '0m:0s'
        }
        return state.jobs[key].executionTime
      }
    },
    getColumns(state): (key: string) => number {
      return (key) => {
        const jobDetails = state.jobs[key]
        if (jobDetails && jobDetails.jobResultData && jobDetails.jobResultData.resultData && jobDetails.jobResultData.resultData.length > 0) {
          return Object.keys(jobDetails.jobResultData.resultData[0]).length
        }
        return 0
      }
    },
    getRows(state): (key: string) => number {
      return (key) => {
        const jobDetails = state.jobs[key]
        if (jobDetails && jobDetails.jobResultData && jobDetails.jobResultData.resultData) {
          return jobDetails.jobResultData.resultData.length
        }
        return 0
      }
    },
    getJobLog(): string | undefined {
      return this.jobLog
    },
  },
  actions: {
    addJob(key: string, jobDetails: JobDetails) {
      this.jobs[key] = jobDetails
    },
    updateJobStatus(key: string, jobStatus: string) {
      if (this.jobs[key]) {
        this.jobs[key].jobStatus = jobStatus
      }
    },
    updateExecutionMode(key: string, executionMode: ExecutionMode) {
      if (this.jobs[key]) {
        this.jobs[key].executionMode = executionMode
      }
    },
    updateJob(key: string, currentJob: Job) {
      if (this.jobs[key]) {
        this.jobs[key].job = currentJob
      }
    },
    updateJobResultData(key: string, jobResultData: JobResultData) {
      if (this.jobs[key]) {
        this.jobs[key].jobResultData = jobResultData
      }
    },
    updateExecutionTime(key: string, executionTime: string) {
      if (this.jobs[key]) {
        this.jobs[key].executionTime = executionTime
      }
    },
    setJobLog(jobLog: string) {
      this.jobLog = jobLog
    },
    resetJob(key: string) {
      if (this.jobs[key]) {
        this.jobs[key] = {
          executionMode: 'Streaming',
          job: null,
          jobResultData: null,
          jobStatus: '',
          executionTime: '0m:0s',
        }
      }
    },
    removeJob(key: string) {
      if (this.jobs[key]) {
        delete this.jobs[key]
      }
    },
  },
})
