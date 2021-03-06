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
/* eslint-disable dot-notation */

import React, { PropTypes } from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './AddCloudConnection.scss';
import Reflux from 'reflux';
import ConnectionsStore from '../../stores/ConnectionsStore';
import ConnectionsActions from '../../actions/ConnectionsActions';
import NotificationActions from '../../actions/NotificationActions';
import Dropdown from '../NewDropdown';
import Switch from '../Switch'
import LoadingIcon from "../LoadingIcon/LoadingIcon";
import ValidateEndpoint from '../ValidateEndpoint';

const title = 'Add Cloud Endpoint';

class AddCloudConnection extends Reflux.Component {

  static contextTypes = {
    onSetTitle: PropTypes.func.isRequired,
  };

  static defaultProps = {
    cloud: null,
    connection: null,
    type: "new"
  }

  constructor(props) {
    super(props)

    this.store = ConnectionsStore

    this.state = {
      type: props.type, // type of operation: new/edit
      connection: props.connection, // connection object (on edit)
      connectionName: "", // connection name field
      description: "", // connection description field
      currentCloud: this.props.cloud, // chosen cloud - if adding a new endpoint
      currentCloudData: null, // endpoint field data
      validateEndpoint: false, // holds the endpoint object when validation
      requiredFields: [], // array that holds all the endpoint required fields - used for field validation
      cloudFormsSubmitted: false // flag that indicates if the form has been submitted - used for field validation
    }
  }

  componentWillMount() {
    super.componentWillMount.call(this)
    this.context.onSetTitle(title);
    if (this.state.currentCloudData == null) {
      this.setState({ currentCloudData: {} })
    }
  }

  componentDidMount() {
    if (this.state.connection) {
      this.state.allClouds.forEach(item => {
        if (item.name === this.state.connection.type) {
          let credentials = this.state.connection.credentials
          let newCredentials = {}
          for (let i in credentials) {
            if (typeof credentials[i] == "object") {
              newCredentials['login_type'] = i
              // credentials['user_credentials'] = {}
              for (let j in credentials[i]) {
                // credentials['user_credentials'][j] = credentials[i][j]
                newCredentials[j] = credentials[i][j]
              }
            } else {
              newCredentials[i] = credentials[i] + ""
            }
          }
          this.setState({
            currentCloudData: newCredentials,
            connectionName: this.state.connection.name,
            description: this.state.connection.description
          }, () => {
            this.chooseCloud(item)
          })
        }
      })
    } else if (this.props.cloud) {
      this.chooseCloud(this.props.cloud)
    }

    // Fixes an issue with focus when multiple modals are rendered and escape key is not captured.
    // Test with adding cloud connection from wizard.
    setTimeout(() => { this.rootDiv.focus() }, 100)
  }

  /**
   * Function called upon saving an endpoint - handles both new and edit operations
   */
  handleSave() {
    let valid = true
    let requiredFields = this.state.requiredFields

    for (let i in this.state.currentCloudData) {
      if (requiredFields.indexOf(i) > -1 && !this.state.currentCloudData[i]) {
        valid = false
      }
    }
    requiredFields.forEach((field) => {
      if (!this.state.currentCloudData[field]) {
        valid = false
      }
    })

    if (this.state.connectionName.trim().length == 0) {
      valid = false
    }

    if (!valid) {
      NotificationActions.notify("Please fill all required fields", "error")
      this.setState({ cloudFormsSubmitted: true })
    } else {
      let credentials = Object.assign({}, this.state.currentCloudData)
      for (let key in credentials) {
        if (credentials[key].label) {
          credentials[key] = credentials[key].value
        }

        let field = this.state.currentCloud.endpoint.fields.find(function findByName(f) { return f.name == this }, key);

        if (!field || !field.dataType) {
          continue;
        }

        // Convert datatype
        switch (field.dataType) {
          case 'boolean':
            credentials[key] = (credentials[key] === true ||
              ((typeof credentials[key] === 'string' || credentials[key] instanceof String) &&
               credentials[key].toLowerCase() == "true"));
            break;
          case 'integer':
            let value = parseInt(credentials[key], 10);
            if (value.toString() != credentials[key]) {
              valid = false;
              NotificationActions.notify('"' + key + '" needs to be an integer', 'error');
            }
            credentials[key] = value;
            break;
          default:
            // retain original value
            break;
        }
      }

      if (!valid) {
        return;
      }

      // If there's a switch radio, create a hierarchical structure with the selected radio as the root.
      this.state.currentCloud.endpoint.fields.forEach(field => {
        if (field.type === 'switch-radio') {
          credentials[credentials[field.name]] = {}

          field.options.forEach(fieldOptions => {
            if (fieldOptions.value === credentials[field.name]) {
              fieldOptions.fields.forEach(fieldOptionField => {
                credentials[credentials[field.name]][fieldOptionField.name] = credentials[fieldOptionField.name]
              })
            }
          })
        }
      })

      // If endpoint is new
      if (this.state.type == "new") {
        ConnectionsActions.newEndpoint({
          name: this.state.connectionName,
          description: this.state.description,
          type: this.state.currentCloud.name,
          connection_info: credentials
        }, (response) => {
          this.setState({
            validateEndpoint: response.data.endpoint,
            type: "edit",
            connection: response.data.endpoint
          })
        })
        this.props.addHandle(this.state.connectionName);
      } else { // If editing an endpoint
        ConnectionsActions.editEndpoint(this.state.connection, {
          name: this.state.connectionName,
          description: this.state.description,
          connection_info: credentials
        }, (response) => {
          this.setState({
            validateEndpoint: response.data.endpoint,
            type: "edit",
            connection: response.data.endpoint
          })
          this.props.updateHandle({
            name: this.state.connectionName,
            description: this.state.description
          })
        })
      }
    }
  }

  /**
   * Handles change `name` property
   * @param e
   */
  handleChangeName(e) {
    this.setState({ connectionName: e.target.value })
  }

  /**
   * Handles change `description` property
   * @param e
   */
  handleChangeDescription(e) {
    this.setState({ description: e.target.value })
  }

  /**
   * Handler to choose the cloud which the endpoint will be assigned to
   * @param cloud
   */
  chooseCloud(cloud) {
    let currentCloudData = {}
    if (this.state.currentCloudData !== null) {
      currentCloudData = this.state.currentCloudData
    }
    let requiredFields = []

    cloud.endpoint.fields.forEach(field => {
      if (typeof currentCloudData[field.name] == "undefined") {
        if (typeof field.defaultValue === 'undefined') {
          currentCloudData[field.name] = "";
        } else {
          currentCloudData[field.name] = field.defaultValue.toString();
        }
      }
      if (field.required) {
        requiredFields.push(field.name)
      }
    })

    this.setState({
      currentCloud: cloud,
      currentCloudData: currentCloudData,
      requiredFields: requiredFields
    }, this.setDefaultValues)
  }

  /**
   * Function that goes back from endpoint validation to edit mode
   */
  backToEdit() {
    this.setState({ validateEndpoint: null })
  }

  /**
   * Handles back operation when adding a new endpoint and want to switch cloud. Resets all previous cloud data.
   */
  handleBack() {
    this.setState({
      currentCloudData: null,
      currentCloud: null,
      requiredFields: null,
      connectionName: "",
      description: null
    })
  }

  /**
   * Sets default values for cloud fields
   */
  setDefaultValues() {
    this.state.currentCloud.endpoint.fields.forEach(field => {
      let currentCloudData = this.state.currentCloudData
      switch (field.type) {
        case 'switch':
          if (field.default && typeof currentCloudData[field.name] == "undefined") {
            currentCloudData[field.name] = field.default
            this.setState({ currentCloudData: currentCloudData })
          }
          break
        case 'switch-radio':
          field.options.forEach(option => {
            if (option.default && !currentCloudData[field.name]) {
              currentCloudData[field.name] = option.value
              this.setRadioRequiredFields(field, option.value)
              this.setState({ currentCloudData: currentCloudData })
            }
          }, this)
          break;
        case 'text':
          if (field.default && typeof currentCloudData[field.name] == "undefined") {
            currentCloudData[field.name] = field.default
            this.setState({ currentCloudData: currentCloudData })
          }
          break
        default:
          break;
      }
    }, this)
  }

  /**
   * Checks whether the field is valid. Only goes through validation if field is required
   * @param field
   * @returns {boolean}
   */
  isValid(field) {
    if (field.required && this.state.cloudFormsSubmitted) {
      if (this.state.currentCloudData[field.name]) {
        return !(this.state.currentCloudData[field.name] && this.state.currentCloudData[field.name].length == 0);
      } else {
        return false
      }
    } else {
      return true
    }
  }

  /**
   * Dinamically change the required fields affected by the current radio selection
   * @param field
   * @param currentValue
   */
  setRadioRequiredFields(field, currentValue) {
    let requiredFields = this.state.requiredFields || [];

    // Remove fields set by previous radio change
    field.options.forEach(option => {
      option.fields.forEach(f => {
        requiredFields = requiredFields.filter(rf => rf !== f.name)
      })
    })

    field.options.forEach(option => {
      if (option.value === currentValue) {
        option.fields.forEach(optionField => {
          if (optionField.required) {
            requiredFields.push(optionField.name);
          }
        })
      }
    })

    this.setState({ requiredFields: requiredFields });
  }

  /**
   * Handles cancel edit/add endpoint
   */
  handleCancel() {
    this.props.closeHandle();
  }

  /**
   * Handler to change the endpoint field
   * @param e
   * @param field
   */
  handleCloudFieldChange(e, field) {
    let currentCloudData = this.state.currentCloudData
    if (field.type == 'dropdown') {
      currentCloudData[field.name] = e.value
    } else if (field.type === 'switch') {
      currentCloudData[field.name] = e.target.checked
    } else {
      currentCloudData[field.name] = e.target.value
    }

    if (field.type === 'switch-radio') {
      this.setRadioRequiredFields(field, e.target.value)
    }

    this.setState({ currentCloudData: currentCloudData })
  }

  /**
   * Renders the cloud list
   * @returns {XML}
   */
  renderCloudList() {
    let clouds = this.state.allClouds.map((cloud, index) => {
      let colorType = ""
      if (cloud.credentials != null && cloud.credentials.length != 0) {
        colorType = ""
      }

      return (
        <div className={s.cloudContainer} key={"cloudImage_" + index}>
          <div
            className={s.cloudImage + " icon large-cloud " + cloud.name + " " + colorType}
            onClick={() => this.chooseCloud(cloud)}
          ></div>
        </div>
      )
    }, this)

    return (
      <div className={s.container}>
        <div className={s.cloudList}>
          {clouds}
        </div>
        <div className={s.buttons}>
          <button className={s.centerBtn + " gray"} onClick={(e) => this.handleCancel(e)}>Cancel</button>
        </div>
      </div>
    )
  }

  /**
   * Renders individual cloud fields
   * @param field
   * @returns {XML}
   */
  renderField(field) {
    let returnValue
    switch (field.type) {
      case "text":
        returnValue = (
          <div className={"form-group " + (this.isValid(field) ? "" : s.error)} key={"cloudField_" + field.name}>
            <div className="input-label">
              {field.label + (field.required ? " *" : "")}
            </div>
            <input
              type="text"
              placeholder={field.label + (field.required ? " *" : "")}
              onChange={(e) => this.handleCloudFieldChange(e, field)}
              value={this.state.currentCloudData[field.name]}
            />
          </div>
        )
        break;
      case "password":
        returnValue = (
          <div className={"form-group " + (this.isValid(field) ? "" : s.error)} key={"cloudField_" + field.name}>
            <div className="input-label">
              {field.label + (field.required ? " *" : "")}
            </div>
            <input
              type="password"
              placeholder={field.label + (field.required ? " *" : "")}
              onChange={(e) => this.handleCloudFieldChange(e, field)}
              value={this.state.currentCloudData[field.name]}
            />
          </div>
        )
        break;
      case 'switch':
        returnValue = (
          <div
            className="form-group"
            key={"cloudField_" + field.name}
          >
            <div className="input-label">
              {field.label + (field.required ? " *" : "")}
            </div>
            <Switch
              className={s.switchButton}
              labelClassName={s.switchLabel}
              checked={this.state.currentCloudData[field.name] === true}
              onChange={(e) => this.handleCloudFieldChange(e, field)}
              checkedLabel="Yes"
              uncheckedLabel="No"
            />
          </div>
        )
        break
      case "dropdown":
        returnValue = (
          <div className={"form-group " + (this.isValid(field) ? "" : s.error)} key={"cloudField_" + field.name}>
            <div className="input-label">
              {field.label + (field.required ? " *" : "")}
            </div>
            <Dropdown
              options={field.options}
              onChange={(e) => this.handleCloudFieldChange(e, field)}
              placeholder="Choose a value"
              value={field.options.find(function findOption(option) { return option.value == this},
                     this.state.currentCloudData[field.name])}
            />
          </div>
        )
        break;
      case "switch-radio":
        let fields = ""
        field.options.forEach((option) => {
          if (option.value == this.state.currentCloudData[field.name]) {
            fields = option.fields.map((optionField) => this.renderField(optionField))
          }
        })
        let radioOptions = field.options.map((option, key) => (
            <div key={"radio_option_" + key} className={s.radioOption}>
              <input
                type="radio"
                value={option.value}
                id={option.name}
                checked={option.value == this.state.currentCloudData[field.name]}
                onChange={(e) => this.handleCloudFieldChange(e, field)}
              /> <label htmlFor={option.name}>{option.label}</label>
            </div>
          )
        )
        returnValue = (
          <div key={"cloudField_" + field.name}>
            <div className="form-group switch-radio" key={"cloudField_" + field.name}>
              { radioOptions }
            </div>
            <div></div>
            <div className={s.cloudFields + ' ' + s.radioFields}>
              {fields}
            </div>
          </div>
        )
        break;
      default:
        break
    }
    return returnValue
  }

  /**
   * Renders the new/edit endpoint form
   * @param cloud
   * @returns {XML}
   */
  renderCloudFields(cloud) {
    let fields = cloud.endpoint.fields.map(field => this.renderField(field), this)

    return (
      <div className={s.container}>
        <div className={s.cloudImage}>
          <div className={" icon large-cloud " + this.state.currentCloud.name}></div>
        </div>
        <div className={s.cloudFields + (cloud.endpoint.fields.length > 6 ? " " + s.larger : "")}>
          <div className={"form-group " + (this.state.cloudFormsSubmitted &&
            this.state.connectionName.trim().length == 0 ? s.error : "")}
          >
            <div className="input-label">
              Endpoint Name *
            </div>
            <input
              type="text"
              placeholder="Endpoint Name *"
              onChange={(e) => this.handleChangeName(e)}
              value={this.state.connectionName}
            />
          </div>
          <div className="form-group">
            <div className="input-label">
              Endpoint Description
            </div>
            <input
              type="text"
              placeholder="Endpoint Description"
              onChange={(e) => this.handleChangeDescription(e)}
              value={this.state.description}
            ></input>
          </div>

          {fields}
        </div>
        <div className={s.buttons}>
          {(this.state.type == "new" && this.props.cloud == null) ? (
            <button className={s.leftBtn + " gray"} onClick={(e) => this.handleBack(e)}>Back</button>
          ) : (
            <button className={s.leftBtn + " gray"} onClick={(e) => this.handleCancel(e)}>Cancel</button>
          )}
          <button className={s.rightBtn} onClick={(e) => this.handleSave(e)}>Save</button>
        </div>
      </div>
    )
  }

  render() {
    let modalBody
    if (this.state.validateEndpoint) {
      modalBody = (
        <ValidateEndpoint
          closeHandle={this.props.closeHandle}
          endpoint={this.state.validateEndpoint}
          backHandle={(e) => this.backToEdit(e)}
        />
      )
    } else if (this.state.currentCloud == null) {
      if (this.state.allClouds) {
        modalBody = this.renderCloudList()
      } else {
        modalBody = <LoadingIcon />
      }
    } else {
      modalBody = this.renderCloudFields(this.state.currentCloud)
    }
    return (
      <div tabIndex="0" className={s.root} ref={rootDiv => { this.rootDiv = rootDiv }}>
        <div className={s.header}>
          <h3>{title}</h3>
        </div>
        {modalBody}
      </div>
    );
  }

}

export default withStyles(AddCloudConnection, s);
