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

import org.apache.paimon.web.server.data.dto.LoginDTO;
import org.apache.paimon.web.server.data.enums.UserType;
import org.apache.paimon.web.server.data.model.RoleMenu;
import org.apache.paimon.web.server.data.model.SysMenu;
import org.apache.paimon.web.server.data.model.SysRole;
import org.apache.paimon.web.server.data.model.User;
import org.apache.paimon.web.server.data.model.UserRole;
import org.apache.paimon.web.server.data.result.exception.BaseException;
import org.apache.paimon.web.server.data.result.exception.user.UserDisabledException;
import org.apache.paimon.web.server.data.result.exception.user.UserNotExistsException;
import org.apache.paimon.web.server.data.result.exception.user.UserPasswordNotMatchException;
import org.apache.paimon.web.server.data.vo.UserInfoVO;
import org.apache.paimon.web.server.data.vo.UserVO;
import org.apache.paimon.web.server.mapper.UserMapper;
import org.apache.paimon.web.server.mapper.UserRoleMapper;
import org.apache.paimon.web.server.service.LdapService;
import org.apache.paimon.web.server.service.RoleMenuService;
import org.apache.paimon.web.server.service.SysMenuService;
import org.apache.paimon.web.server.service.SysRoleService;
import org.apache.paimon.web.server.service.TenantService;
import org.apache.paimon.web.server.service.UserRoleService;
import org.apache.paimon.web.server.service.UserService;
import org.apache.paimon.web.server.util.StringUtils;

import cn.dev33.satoken.secure.SaSecureUtil;
import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

/** UserServiceImpl. */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Autowired private LdapService ldapService;
    @Autowired private UserMapper userMapper;
    @Autowired private UserRoleService userRoleService;
    @Autowired private SysRoleService sysRoleService;
    @Autowired private RoleMenuService roleMenuService;
    @Autowired private SysMenuService sysMenuService;
    @Autowired private TenantService tenantService;
    @Autowired private UserRoleMapper userRoleMapper;

    @Override
    public UserVO getUserById(Integer id) {
        User user = userMapper.selectUserById(id);
        if (Objects.nonNull(user)) {
            return toVo(user);
        }
        return null;
    }

    @Override
    public List<UserVO> selectUserList(IPage<User> page, User user) {
        return userMapper.selectUserList(page, user).stream()
                .map(this::toVo)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserVO> listUsers() {
        return this.list().stream().map(this::toVo).collect(Collectors.toList());
    }

    @Override
    public boolean checkUserNameUnique(User user) {
        int roleId = user.getId() == null ? -1 : user.getId();
        User info = this.lambdaQuery().eq(User::getUsername, user.getUsername()).one();
        return info == null || info.getId() == roleId;
    }

    /**
     * login by username and password.
     *
     * @param loginDTO login info
     * @return {@link String}
     */
    @Override
    public UserInfoVO login(LoginDTO loginDTO) throws BaseException {
        String username = loginDTO.getUsername();
        String password = loginDTO.getPassword();

        User user =
                loginDTO.isLdapLogin()
                        ? ldapLogin(username, password)
                        : localLogin(username, password);
        if (!user.getEnabled()) {
            throw new UserDisabledException();
        }
        // query user info
        UserInfoVO userInfoVo = getUserInfoVo(user);
        // todo: Currently do not bind tenants
        /*if (CollectionUtils.isEmpty(userInfoVo.getTenantList())) {
            throw new UserNotBindTenantException();
        }*/

        StpUtil.login(user.getId(), loginDTO.isRememberMe());

        return userInfoVo;
    }

    /**
     * get user info. include user, role, menu. tenant.
     *
     * @param user user
     * @return {@link UserInfoVO}
     */
    private UserInfoVO getUserInfoVo(User user) {
        UserInfoVO userInfoVo = new UserInfoVO();
        userInfoVo.setUser(user);
        userInfoVo.setSaTokenInfo(StpUtil.getTokenInfo());

        // get user role list
        List<SysRole> sysRoles = new ArrayList<>();
        List<UserRole> userRoleList = userRoleService.selectUserRoleListByUserId(user);

        // get role list
        userRoleList.forEach(
                userRole -> {
                    sysRoles.add(sysRoleService.getById(userRole.getRoleId()));
                });
        userInfoVo.setRoleList(sysRoles);
        // get menu list
        List<SysMenu> sysMenus = new ArrayList<>();
        userRoleList.forEach(
                userRole -> {
                    roleMenuService
                            .list(
                                    new LambdaQueryWrapper<RoleMenu>()
                                            .eq(RoleMenu::getRoleId, userRole.getRoleId()))
                            .forEach(
                                    roleMenu -> {
                                        sysMenus.add(sysMenuService.getById(roleMenu.getMenuId()));
                                    });
                });
        userInfoVo.setSysMenuList(sysMenus);

        userInfoVo.setCurrentTenant(tenantService.getById(1));
        return userInfoVo;
    }

    private User localLogin(String username, String password) throws BaseException {
        User user =
                this.lambdaQuery()
                        .eq(User::getUsername, username)
                        .eq(User::getUserType, UserType.LOCAL.getCode())
                        .one();
        if (user == null) {
            throw new UserNotExistsException();
        }

        if (SaSecureUtil.md5(password).equals(user.getPassword())) {
            return user;
        } else {
            throw new UserPasswordNotMatchException();
        }
    }

    private User ldapLogin(String username, String password) throws BaseException {
        Optional<User> authenticate = ldapService.authenticate(username, password);
        if (!authenticate.isPresent()) {
            throw new UserPasswordNotMatchException();
        }

        User user =
                this.lambdaQuery()
                        .eq(User::getUsername, username)
                        .eq(User::getUserType, UserType.LDAP.getCode())
                        .one();
        if (user == null) {
            user = authenticate.get();
            this.save(user);
            // TODO assign default roles and tenants
        }
        return user;
    }

    /**
     * Query the list of assigned user roles.
     *
     * @param user query params
     * @return user list
     */
    @Override
    public List<User> selectAllocatedList(User user) {
        return userMapper.selectAllocatedList(user);
    }

    /**
     * Query the list of unassigned user roles.
     *
     * @param user query params
     * @return user list
     */
    @Override
    public List<User> selectUnallocatedList(User user) {
        return userMapper.selectUnallocatedList(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int insertUser(User user) {
        this.save(user);
        return insertUserRole(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateUser(User user) {
        this.updateById(user);
        userRoleMapper.deleteUserRoleByUserId(user.getId());
        return insertUserRole(user);
    }

    @Override
    public boolean updateUserStatus(User user) {
        return this.lambdaUpdate()
                .set(User::getEnabled, user.getEnabled())
                .eq(User::getId, user.getId())
                .update();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int deleteUserByIds(Integer[] userIds) {
        userRoleMapper.deleteUserRole(userIds);
        return userMapper.deleteBatchIds(Arrays.asList(userIds));
    }

    @Override
    public int allocateRole(User user) {
        return this.insertUserRole(user);
    }

    private int insertUserRole(User user) {
        int rows = 1;
        if (user.getRoleIds() != null && user.getRoleIds().length > 0) {
            List<UserRole> list = new ArrayList<>();
            for (Integer roleId : user.getRoleIds()) {
                UserRole userRole = new UserRole();
                userRole.setUserId(user.getId());
                userRole.setRoleId(roleId);
                list.add(userRole);
            }
            if (list.size() > 0) {
                rows = userRoleMapper.batchUserRole(list);
            }
        }
        return rows;
    }

    private UserVO toVo(User user) {
        return UserVO.builder()
                .username(user.getUsername())
                .nickname(StringUtils.isNotEmpty(user.getNickname()) ? user.getNickname() : "")
                .userType(user.getUserType() == 0 ? "LOCAL" : "LDAP")
                .mobile(StringUtils.isNotEmpty(user.getMobile()) ? user.getMobile() : "")
                .email(StringUtils.isNotEmpty(user.getEmail()) ? user.getEmail() : "")
                .enabled(user.getEnabled())
                .createTime(user.getCreateTime())
                .updateTime(user.getUpdateTime())
                .build();
    }
}
