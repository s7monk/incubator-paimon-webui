/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.paimon.web.server.service.impl;

import org.apache.paimon.web.server.data.model.JobInfo;
import org.apache.paimon.web.server.mapper.JobMapper;
import org.apache.paimon.web.server.service.JobService;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/** The implementation of {@link JobService}. */
@Service
public class JobServiceImpl extends ServiceImpl<JobMapper, JobInfo> implements JobService {

    @Autowired private JobMapper jobMapper;

    @Override
    public boolean saveJob(JobInfo jobInfo) {
        return this.save(jobInfo);
    }

    @Override
    public boolean updateJobStatusAndEndTime(
            String jobId, String newStatus, LocalDateTime endTime) {
        JobInfo jobInfo = new JobInfo();
        jobInfo.setStatus(newStatus);
        jobInfo.setEndTime(endTime);
        return this.update(jobInfo, new QueryWrapper<JobInfo>().eq("job_id", jobId));
    }

    @Override
    public boolean updateJobStatusAndStartTime(
            String jobId, String newStatus, LocalDateTime startTime) {
        JobInfo jobInfo = new JobInfo();
        jobInfo.setStatus(newStatus);
        jobInfo.setStartTime(startTime);
        return this.update(jobInfo, new QueryWrapper<JobInfo>().eq("job_id", jobId));
    }

    @Override
    public List<JobInfo> listJobsByPage(int current, int size) {
        QueryWrapper<JobInfo> queryWrapper = new QueryWrapper<>();
        queryWrapper.orderByDesc("create_time");
        Page<JobInfo> page = new Page<>(current, size);
        IPage<JobInfo> jobInfoIPage = jobMapper.selectPage(page, queryWrapper);
        return jobInfoIPage.getRecords();
    }

    @Override
    public JobInfo getJobByJobId(String jobId) {
        QueryWrapper<JobInfo> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("job_id", jobId);
        return jobMapper.selectOne(queryWrapper);
    }
}