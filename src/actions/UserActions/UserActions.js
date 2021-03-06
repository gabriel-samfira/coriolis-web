/*
Copyright (C) 2017  Cloudbase Solutions SRL

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import Reflux from 'reflux';
import Api from '../../components/ApiCaller';
import { servicesUrl, defaultDomain } from '../../config';


let UserAction = Reflux.createActions({
  login: { children: ["success", "failed"] },
  loginGoogle: { children: ["success", "failed"] },
  loginScope: { children: ["success", "failed"] },
  logout: {},
  tokenLogin: { children: ["failed"] },
  setCurrentUser: {},
  switchProject: {},
  getScopedProjects: { children: ["completed", "failed"] },
  loadProjects: { children: ["completed", "failed"] },
  federateToken: { },
  getUserInfo: { children: ["completed", "failed"] },
  setUserInfo: { children: ["success", "failed"] }
})

UserAction.login.listen((userData, callback = null) => {
  let auth = {
    auth: {
      identity: {
        methods: [
          "password"
        ],
        password: {
          user: {
            name: userData.name,
            domain: {
              name: userData.domain ? userData.domain : defaultDomain
            },
            password: userData.password
          }
        }
      },
      scope: "unscoped"
    }
  }

  Api.setDefaultHeader({ "X-Auth-Token": null })

  Api.sendAjaxRequest({
    url: servicesUrl.identity,
    method: "POST",
    data: auth
  })
    .then((response) => {
      UserAction.login.success(response)
    }, () => {
      UserAction.login.failed()
      if (typeof callback == "function") {
        callback()
      }
    })
})

UserAction.loginScope.listen((token, projectId, fallback = true) => {
  let auth = {
    auth: {
      identity: {
        methods: [
          "token"
        ],
        token: {
          id: token
        }
      },
      scope: {
        project: {
          id: projectId
        }
      }
    }
  }

  Api.setDefaultHeader({ "X-Auth-Token": null })

  Api.sendAjaxRequest({
    url: servicesUrl.identity,
    method: "POST",
    data: auth
  })
    .then((response) => {
      UserAction.loginScope.success(response)
    }, () => {
      if (fallback) {
        UserAction.loginScope.failed(token)
      }
    })
})

UserAction.tokenLogin.listen((token) => {
  Api.sendAjaxRequest({
    url: servicesUrl.identity,
    method: "GET",
    headers: { 'X-Subject-Token': token }
  })
  .then(UserAction.login.success, UserAction.tokenLogin.failed)
  .catch((response) => {
    UserAction.tokenLogin.failed(response)
  });
})

UserAction.getScopedProjects.listen((callback) => {
  Api.sendAjaxRequest({
    url: servicesUrl.projects,
    method: "GET"
  })
    .then(
      (response) => {
        if (callback) {
          callback(response)
        }
        UserAction.getScopedProjects.completed(response)
      }, UserAction.getScopedProjects.failed)
    .catch((response) => {
      UserAction.getScopedProjects.failed(response)
    });
})

UserAction.getUserInfo.listen((userId) => {
  Api.sendAjaxRequest({
    url: servicesUrl.users + "/" + userId,
    method: "GET"
  })
    .then(
      (response) => {
        UserAction.getUserInfo.completed(response)
      }, UserAction.getUserInfo.failed)
    .catch((response) => {
      UserAction.getUserInfo.failed(response)
    });
})

UserAction.setUserInfo.listen((userId, userObject) => {
  Api.sendAjaxRequest({
    url: servicesUrl.users + "/" + userId,
    method: "PATCH",
    data: {
      user: userObject
    }
  })
    .then(
      (response) => {
        UserAction.setUserInfo.completed(response)
      }, UserAction.setUserInfo.failed)
    .catch((response) => {
      UserAction.setUserInfo.failed(response)
    });
})

export default UserAction;
