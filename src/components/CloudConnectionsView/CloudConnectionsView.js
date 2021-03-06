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

import React, { Component, PropTypes } from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './CloudConnectionsView.scss';
import Header from '../Header';
import ConnectionsActions from '../../actions/ConnectionsActions';
import Location from '../../core/Location';
import LoadingIcon from '../LoadingIcon';
import Modal from 'react-modal';
import AddCloudConnection from '../AddCloudConnection';
import ConfirmationDialog from '../ConfirmationDialog'
import ValidateEndpoint from '../ValidateEndpoint';


class CloudConnectionsView extends Component {

  static propTypes = {
    connection: PropTypes.object,
    connections: PropTypes.array,
    children: PropTypes.object,
    connectionId: PropTypes.string
  }

  static defaultProps = {
    connection: null
  }

  static contextTypes = {
    onSetTitle: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props)
    this.state = {
      connection: {
        name: null,
        type: null,
        id: null
      },
      confirmationDialog: {
        visible: false,
        message: "Are you sure?",
        onConfirm: null,
        onCancel: null
      },
      showModal: false,
      showValidationModal: false
    }
  }

  componentDidMount() {
    this.context.onSetTitle(this.title);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.connections) {
      let connection = newProps.connections.filter(item => item.id === this.props.connectionId)[0]

      this.setState({ connection: connection })
    }
  }

  onConnectionsActionsChange(option) {
    switch (option.value) {
      case "delete":
        ConnectionsActions.deleteConnection(this.state.connection)
        Location.push('/cloud-endpoints')
        break
      default:
        break
    }
  }

  title = ""

  showEditConnectionModal() {
    this.setState({ showModal: true })
  }

  deleteConnection() {
    this.setState({
      confirmationDialog: {
        visible: true,
        onConfirm: () => {
          this.setState({ confirmationDialog: { visible: false } })
          ConnectionsActions.deleteConnection(this.state.connection)
          Location.push('/cloud-endpoints')
        },
        onCancel: () => {
          this.setState({ confirmationDialog: { visible: false } })
        }
      }
    })
  }

  validateConnection() {
    this.setState({ showValidationModal: true })
  }

  closeValidationModal() {
    this.setState({ showValidationModal: false })
  }

  closeModal() {
    this.setState({ showModal: false })
    let connection = this.props.connections.filter(item => item.id === this.props.connectionId)[0]

    this.setState({ connection: connection })
  }

  addItem() {
    this.validateConnection()

    this.setState({ showModal: false })
    let connection = this.props.connections.filter(item => item.id === this.props.connectionId)[0]

    this.setState({ connection: connection })
  }

  updateItem(itemAttrs) {
    let endpoint = this.state.connection
    for (let i in itemAttrs) {
      endpoint[i] = itemAttrs[i]
    }
    this.setState({
      connection: endpoint,
      showModal: false
    })
    this.validateConnection()
  }

  goBack() {
    Location.push("/cloud-endpoints")
  }

  render() {
    let item = this.state.connection
    let title = "Edit Connection"

    let modalStyle = {
      overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(164, 170, 181, 0.69)"
      },
      content: {
        padding: "0px",
        border: "none",
        borderRadius: "4px",
        bottom: "auto",
        width: "576px",
        height: "auto",
        left: "50%",
        top: "120px",
        marginLeft: "-288px"
      }
    }

    let validationModalStyle = {
      overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(164, 170, 181, 0.69)"
      },
      content: {
        padding: "0px",
        borderRadius: "4px",
        border: "none",
        bottom: "auto",
        width: "400px",
        height: "300px",
        left: "50%",
        top: "50%",
        marginTop: "-200px",
        marginLeft: "-150px"
      }
    }

    if (item) {
      return (
        <div className={s.root}>
          <Header title={title} linkUrl="/cloud-endpoints" />
          <div className={s.connectionHead + " detailViewHead"}>
            <div className={s.container}>
              <div className="backBtn" onClick={(e) => this.goBack(e)}></div>
              <div className={s.connectionTypeImg + " icon endpoint-white "}></div>
              <div className={s.connectionInfo}>
                <h2>{item.name}</h2>
                <p>{item.description}</p>
              </div>
            </div>
          </div>
          <div className={s.container}>
            <div className={s.sidebar}>

            </div>
            <div className={s.content}>
              <div className={`${s.connectionTypeImg} ${(item && item.type) || ''}`}></div>
              {React.cloneElement(this.props.children, { connection: item })}
              <div className={s.buttons}>
                <div className={s.leftSide}>
                  <button onClick={(e) => this.showEditConnectionModal(e)} className="gray">Edit Endpoint</button>
                  <br />
                  <button onClick={(e) => this.validateConnection(e)}>Validate Endpoint</button>
                </div>
                <div className={s.rightSide}>
                  <button onClick={(e) => this.deleteConnection(e)} className="wire red" style={{ float: "right" }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
          <Modal
            isOpen={this.state.showModal}
            contentLabel="Add new cloud connection"
            style={modalStyle}
            onRequestClose={this.closeModal.bind(this)}
          >
            <AddCloudConnection
              closeHandle={(e) => this.closeModal(e)}
              addHandle={(e) => this.addItem(e)}
              updateHandle={(e) => this.updateItem(e)}
              connection={item}
              type="edit"
            />
          </Modal>
          <Modal
            isOpen={this.state.showValidationModal}
            contentLabel="Validate Endpoint"
            style={validationModalStyle}
            onRequestClose={this.closeValidationModal.bind(this)}
          >
            <ValidateEndpoint
              closeHandle={(e) => this.closeValidationModal(e)}
              endpoint={item}
            />
          </Modal>
          <ConfirmationDialog
            visible={this.state.confirmationDialog.visible}
            message={this.state.confirmationDialog.message}
            onConfirm={(e) => this.state.confirmationDialog.onConfirm(e)}
            onCancel={(e) => this.state.confirmationDialog.onCancel(e)}
          />
        </div>
      );
    } else {
      return (
        <div className={s.root}>
          <Header title={title} linkUrl="/cloud-endpoints" />
          <div className={s.container}>
            <LoadingIcon />
          </div>
        </div>)
    }
  }
}

export default withStyles(CloudConnectionsView, s);
