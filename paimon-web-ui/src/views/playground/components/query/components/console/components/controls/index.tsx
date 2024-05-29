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

import { Copy, DataTable, Renew } from '@vicons/carbon'
import { StopOutline, Stop } from '@vicons/ionicons5'
import { ClockCircleOutlined, DownloadOutlined, LineChartOutlined } from '@vicons/antd'
import styles from './index.module.scss'
import { useConfigStore } from '@/store/config'
import type {Job, JobResultData} from "@/api/models/job/types/job"
import {fetchResult, getJobStatus, stopJob} from "@/api/models/job"
import {useMessage} from "naive-ui"

export default defineComponent({
  name: 'TableActionBar',
  setup: function () {
    const {t} = useLocaleHooks()
    const message = useMessage()

    const currentJob = ref<Job | null>(null)
    const tableData = ref<JobResultData | null>(null)
    const jobStatus = ref<string>('')
    const selectedInterval = ref('Disabled')
    const intervalId = ref<number | null>(null);

    const configStore = useConfigStore()
    const isDarkMode = computed(() => configStore.theme === 'dark')

    const activeButton = ref('table')
    const setActiveButton = (button: any) => {
      activeButton.value = button
    }

    const {mittBus} = getCurrentInstance()!.appContext.config.globalProperties
    mittBus.on('jobResult', (jobData: any) => {
      currentJob.value = jobData;
    })

    const handleRefreshData = async () => {
      if (currentJob.value) {
        if (currentJob.value.shouldFetchResult) {
          try {
            const resultFetchDTO = {
              submitId: currentJob.value.submitId,
              clusterId: currentJob.value.clusterId,
              sessionId: currentJob.value.sessionId,
              taskType: currentJob.value.type,
              token: currentJob.value.token
            }

            const response: any = await fetchResult(resultFetchDTO);
            console.log(response.data)
            tableData.value = response.data;
            mittBus.emit('refreshedResult', response.data)
          } catch (error) {
            tableData.value = null;
            console.error('Error fetching result:', error)
          }
        } else {
          message.warning(t('playground.no_data'))
        }
      } else {
        message.warning(t('playground.no_data'))
      }
    }

    const handleStopJob = async () => {
      if (currentJob.value) {
        const stopJobDTO = {
          clusterId: currentJob.value.clusterId,
          jobId: currentJob.value.jobId,
          taskType: currentJob.value.type,
          withSavepoint: false
        }
        try {
          const response: any = await stopJob(stopJobDTO);
          if (response.code === 200) {
            message.success(t('playground.job_stopping_successfully'))
          } else {
            message.warning(t('playground.job_stopping_failed'))
          }
        } catch (error) {
          message.warning(t('playground.job_stopping_failed'))
        }
      }
    }

    onMounted(() => {
      setInterval(async () => {
        if (currentJob.value && currentJob.value.jobId) {
          const response: any = await getJobStatus(currentJob.value.jobId)
          if (response.data) {
            jobStatus.value = response.data.status
          }
        }
      }, 1000);
    });

    const currentStopIcon = computed(() => jobStatus.value === 'RUNNING' ? StopOutline : Stop);

    const isButtonDisabled = computed(() => {
      return jobStatus.value !== 'RUNNING'
    })

    const jobStatusColor = computed(() => {
      switch (jobStatus.value.toUpperCase()) {
        case 'RUNNING':
          return '#33994A'
        case 'CANCELED':
          return '#f6b658'
        case 'FINISHED':
          return '#f5c1bd'
        case 'FAILED':
          return '#f9827c'
        default:
          return '#7ce998';
      }
    })

    const formattedJobStatus = computed(() => {
      return jobStatus.value.charAt(0).toUpperCase() + jobStatus.value.slice(1).toLowerCase()
    })

    const dropdownOptions = [
      { label: 'Disabled', key: 'Disabled' },
      { label: '5s', key: '5s' },
      { label: '10s', key: '10s' },
      { label: '30s', key: '30s' },
      { label: '1m', key: '1m' },
      { label: '5m', key: '5m' }
    ];

    const clearRefreshInterval = () => {
      if (intervalId.value) {
        clearInterval(intervalId.value);
        intervalId.value = null;
      }
    }

    const setRefreshInterval = (milliseconds: number) => {
      clearRefreshInterval();
      intervalId.value = setInterval(handleRefreshData, milliseconds);
    }

    const handleSelect = (key: any) => {
      selectedInterval.value = key
      switch (key) {
        case '5s':
          setRefreshInterval(5000);
          break;
        case '10s':
          setRefreshInterval(10000);
          break;
        case '30s':
          setRefreshInterval(30000);
          break;
        case '1m':
          setRefreshInterval(60000);
          break;
        case '5m':
          setRefreshInterval(300000);
          break;
        case 'Disabled':
        default:
          clearRefreshInterval();
          break;
      }
    }

    return {
      t,
      mittBus,
      activeButton,
      setActiveButton,
      isDarkMode,
      handleRefreshData,
      tableData,
      jobStatus,
      currentStopIcon,
      isButtonDisabled,
      handleStopJob,
      formattedJobStatus,
      jobStatusColor,
      dropdownOptions,
      selectedInterval,
      handleSelect
    }
  },
  render() {
    return (
      <div class={styles.container}>
        <n-space class={styles.left} item-style="display: flex; align-items: center;">
          <n-popover
            trigger="hover"
            placement="bottom-start"
            show-arrow={false}
            style="padding: 0"
            v-slots={{
              trigger: () => (
                <n-button
                  text
                  class={this.activeButton === 'table' ? styles['active-button'] : styles['table-action-bar-button']}
                  onClick={() => this.setActiveButton('table')}
                  v-slots={{
                    icon: () => <n-icon component={DataTable} size="20"></n-icon>,
                  }}
                >
                </n-button>
              ),
            }}
          >
            <span>{this.t('playground.switch_to_table')}</span>
          </n-popover>
          <n-popover
            trigger="hover"
            placement="bottom-start"
            show-arrow={false}
            v-slots={{
              trigger: () => (
                <n-button
                  text
                  class={this.activeButton === 'chart' ? styles['active-button'] : styles['table-action-bar-button']}
                  onClick={() => this.setActiveButton('chart')}
                  v-slots={{
                    icon: () => <n-icon component={LineChartOutlined} size="20"></n-icon>,
                  }}
                >
                </n-button>
              ),
            }}
          >
            <span>{this.t('playground.switch_to_chart')}</span>
          </n-popover>
          <n-divider vertical style="height: 20px; margin-left: 0px; margin-right: 0px; border-left-width: 3px;" />
          <n-popover
            trigger="hover"
            placement="bottom-start"
            show-arrow={false}
            v-slots={{
              trigger: () => (
                <n-button
                  text
                  onClick={this.handleRefreshData}
                  class={styles['table-action-bar-button']}
                  v-slots={{
                    icon: () => <n-icon component={Renew} size="20"></n-icon>,
                  }}
                >
                </n-button>
              ),
            }}
          >
            <span>{this.t('playground.refresh_data')}</span>
          </n-popover>
          <n-popover
            trigger="hover"
            placement="bottom-start"
            show-arrow={false}
            v-slots={{
              trigger: () => (
                <n-button
                  text
                  onClick={this.handleStopJob}
                  disabled={this.isButtonDisabled}
                  class={this.jobStatus === 'RUNNING' ? styles['stop-button-running'] : styles['table-action-bar-button']}
                  v-slots={{
                    icon: () => <n-icon component={this.currentStopIcon} size="20"></n-icon>,
                  }}
                >
                </n-button>
              ),
            }}
          >
            <span>{this.t('playground.stop_job')}</span>
          </n-popover>
          <n-dropdown
            trigger="click"
            size="small"
            placement="bottom-start"
            options={this.dropdownOptions}
            v-model:value={this.selectedInterval}
            on-select={this.handleSelect}
            v-slots={{
              trigger: () => (
                <n-button text class={styles['table-action-bar-button']}>
                </n-button>
              ),
              default: () => (
                <n-icon
                  size="20"
                  class={styles['table-action-bar-button']}
                  component={ClockCircleOutlined}/>
              )
            }}
          />
          <n-divider vertical style="height: 20px; margin-left: 0px; margin-right: 0px;" />
          <span class={styles['table-action-bar-text']}>{this.tableData?.columns} Columns</span>
        </n-space>
        <div class={styles.right}>
          <n-space item-style="display: flex; align-items: center;">
            <div class={styles['table-action-bar-text']}>
              Job:
              <span style={{color: this.jobStatusColor}}> {this.formattedJobStatus}</span>
            </div>
            <span class={styles['table-action-bar-text']}>Rows: {this.tableData?.rows}</span>
            <span class={styles['table-action-bar-text']}>1m:06s</span>
            <n-popover
              trigger="hover"
              placement="bottom-start"
              show-arrow={false}
              v-slots={{
                trigger: () => (
                  <n-button
                    text
                    onClick={() => this.mittBus.emit('triggerDownloadCsv')}
                    class={styles['table-action-bar-button']}
                    v-slots={{
                      icon: () => <n-icon component={DownloadOutlined} size="20"></n-icon>,
                    }}
                  >
                  </n-button>
                ),
              }}
            >
              <span>{this.t('playground.download')}</span>
            </n-popover>
            <n-popover
              trigger="hover"
              placement="bottom-start"
              show-arrow={false}
              v-slots={{
                trigger: () => (
                  <n-button
                    text
                    onClick={() => this.mittBus.emit('triggerCopyData')}
                    class={styles['table-action-bar-button']}
                    v-slots={{
                      icon: () => <n-icon component={Copy} size="20"></n-icon>,
                    }}
                  >
                  </n-button>
                ),
              }}
            >
              <span>{this.t('playground.copy')}</span>
            </n-popover>
          </n-space>
        </div>
      </div>
    )
  },
})
