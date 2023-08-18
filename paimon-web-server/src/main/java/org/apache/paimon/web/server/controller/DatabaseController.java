/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.paimon.web.server.controller;

import org.apache.paimon.catalog.Catalog;
import org.apache.paimon.web.api.catalog.CatalogCreator;
import org.apache.paimon.web.api.database.DatabaseManager;
import org.apache.paimon.web.server.data.model.CatalogInfo;
import org.apache.paimon.web.server.data.model.DatabaseInfo;
import org.apache.paimon.web.server.data.result.R;
import org.apache.paimon.web.server.data.result.enums.Status;
import org.apache.paimon.web.server.service.CatalogService;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

/** Database api controller. */
@Slf4j
@RestController
@RequestMapping("/api/database")
public class DatabaseController {

    @Autowired private CatalogService catalogService;

    /**
     * Creates a new database based on the provided DatabaseInfo.
     * @param databaseInfo The DatabaseInfo object containing the details of the new database.
     * @return R<Void> indicating the result of the operation.
     */
    @PostMapping("/createDatabase")
    public R<Void> createDatabase(@RequestBody DatabaseInfo databaseInfo) {
        try {
            CatalogInfo catalogInfo = getCatalogInfo(databaseInfo);
            Catalog catalog = getCatalog(catalogInfo);
            if (DatabaseManager.databaseExists(catalog, databaseInfo.getDatabaseName())) {
                return R.failed(Status.DATABASE_NAME_IS_EXIST, databaseInfo.getDatabaseName());
            }
            DatabaseManager.createDatabase(catalog, databaseInfo.getDatabaseName());
            return R.succeed();
        } catch (Exception e) {
            e.printStackTrace();
            return R.failed(Status.CATALOG_CREATE_ERROR);
        }
    }

    /**
     /**
     * Get all database information.
     *
     * @return The list of all databases.
     */
    @GetMapping("/getAllDatabases")
    public R<List<DatabaseInfo>> getAllDatabases() {
        List<DatabaseInfo> databaseInfoList = new ArrayList<>();
        List<CatalogInfo> catalogInfoList = catalogService.list();
        catalogInfoList.forEach(item -> {
            Catalog catalog = getCatalog(item);
            List<String> list = DatabaseManager.listDatabase(catalog);
            list.forEach(databaseName -> {
                DatabaseInfo info = DatabaseInfo
                        .builder()
                        .databaseName(databaseName)
                        .catalogId(item.getId())
                        .description("")
                        .build();
                databaseInfoList.add(info);
            });
        });
        return R.succeed(databaseInfoList);
    }

    /**
     * Retrieves the associated CatalogInfo object based on the given DatabaseInfo object.
     * @param databaseInfo The DatabaseInfo object for which to retrieve the associated CatalogInfo.
     * @return The associated CatalogInfo object, or null if it doesn't exist.
     */
    private CatalogInfo getCatalogInfo(DatabaseInfo databaseInfo) {
        LambdaQueryWrapper<CatalogInfo> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(CatalogInfo::getId, databaseInfo.getCatalogId());
        return catalogService.getOne(queryWrapper);
    }

    /**
     * Get a Catalog based on the provided CatalogInfo.
     *
     * @param catalogInfo The CatalogInfo object containing the catalog details.
     * @return The created Catalog object.
     */
    private Catalog getCatalog(CatalogInfo catalogInfo) {
        if ("filesystem".equals(catalogInfo.getCatalogType())) {
            return CatalogCreator.createFilesystemCatalog(catalogInfo.getWarehouse());
        } else {
            return CatalogCreator.createHiveCatalog(
                    catalogInfo.getWarehouse(),
                    catalogInfo.getHiveUri(),
                    catalogInfo.getHiveConfDir());
        }
    }
}
