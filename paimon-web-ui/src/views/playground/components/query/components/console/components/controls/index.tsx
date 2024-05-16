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

import styles from './index.module.scss'
import { TableChartOutlined, StopOutlined } from "@vicons/material";
import { LineChartOutlined, ClockCircleOutlined, DownloadOutlined } from "@vicons/antd";
import {Refresh} from "@vicons/tabler";
import {Copy20Regular} from "@vicons/fluent";

export default defineComponent({
  name: 'TableActionBar',
  setup() {
    const { t } = useLocaleHooks()

    return {
      t,
    }
  },
  render() {
    return (
      <div class={styles.container}>
       <n-space class={styles.left}>
         <n-popover trigger="hover" placement="bottom-start" show-arrow={false}
                    v-slots={{
                      trigger: () => (
                        <n-button
                          text
                          v-slots={{
                            icon: () => <n-icon component={TableChartOutlined} size="20"></n-icon>
                          }}
                        >
                        </n-button>
                      )
                    }}>
           <span>{this.t('playground.switch_to_table')}</span>
         </n-popover>
         <n-popover trigger="hover" placement="bottom-start" show-arrow={false}
                    v-slots={{
                      trigger: () => (
                        <n-button
                          text
                          v-slots={{
                            icon: () => <n-icon component={LineChartOutlined} size="20"></n-icon>
                          }}
                        >
                        </n-button>
                      )
                    }}>
           <span>{this.t('playground.switch_to_chart')}</span>
         </n-popover>
         <span>|</span>
         <n-popover trigger="hover" placement="bottom-start" show-arrow={false}
                    v-slots={{
                      trigger: () => (
                        <n-button
                          text
                          v-slots={{
                            icon: () => <n-icon component={Refresh} size="20"></n-icon>
                          }}
                        >
                        </n-button>
                      )
                    }}>
           <span>{this.t('playground.refresh_data')}</span>
         </n-popover>
         <n-popover trigger="hover" placement="bottom-start" show-arrow={false}
                    v-slots={{
                      trigger: () => (
                        <n-button
                          text
                          v-slots={{
                            icon: () => <n-icon component={StopOutlined} size="24"></n-icon>
                          }}
                        >
                        </n-button>
                      )
                    }}>
           <span>{this.t('playground.stop_job')}</span>
         </n-popover>
         <n-popover trigger="hover" placement="bottom-start" show-arrow={false}
                    v-slots={{
                      trigger: () => (
                        <n-button
                          text
                          v-slots={{
                            icon: () => <n-icon component={ClockCircleOutlined} size="19"></n-icon>
                          }}
                        >
                        </n-button>
                      )
                    }}>
           <span>{this.t('playground.schedule_refresh')}</span>
         </n-popover>
         <span>|</span>
         <span>4 Columns</span>
       </n-space>
        <div class={styles.right}>
          <n-space>
            <span>Job: Running</span>
            <span>Rows: 3</span>
            <span>1m:06s</span>
            <n-popover trigger="hover" placement="bottom-start" show-arrow={false}
                       v-slots={{
                         trigger: () => (
                           <n-button
                             text
                             v-slots={{
                               icon: () => <n-icon component={DownloadOutlined} size="20"></n-icon>
                             }}
                           >
                           </n-button>
                         )
                       }}>
              <span>{this.t('playground.copy')}</span>
            </n-popover>
            <n-popover trigger="hover" placement="bottom-start" show-arrow={false}
                       v-slots={{
                         trigger: () => (
                           <n-button
                             text
                             v-slots={{
                               icon: () => <n-icon component={Copy20Regular} size="20"></n-icon>
                             }}
                           >
                           </n-button>
                         )
                       }}>
              <span>{this.t('playground.download')}</span>
            </n-popover>
          </n-space>
        </div>
      </div>
    )
  }
})