import { useState } from 'react';
import Blockies from 'react-blockies';
import {
  Button, Container, ModalHeader, Modal,
  ModalBody, className, Input, Spinner
} from 'reactstrap';
import BigNumber from "bignumber.js";
import erc20 from '../abis/irc.abi.json';
const ERC20_DECIMALS = 18;
const contractAddress = "0x7bb2a5a715d1304C12355ad34b7CEE200DDe0791";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";


const Index = ({ requests, contract, kit, address, loading, getBalance }) => {
  const [modal, setModal] = useState(false);
  const [requestDetails, setRequestDetails] = useState({})
  const [message, setMessage] = useState('')
  const [chats, setChats] = useState(null)
  const [disabled, setDisabled] = useState(false)
  const [loadChats, setLoadChats] = useState(false)
  const [viewChats, setViewChats] = useState(false)
  const [disableChatButton, setDisableChaButton] = useState(false)

  const toggle = () => {
    setViewChats(false)
    setModal(!modal)
  };

  const closeBtn = (
    <button className="close" onClick={toggle} type="button">
      &times;
    </button>
  );

  const getRequests = async function (id) {
    let _request = new Promise(async (resolve, reject) => {
      let data = await contract.methods.fetchPayeeById(id).call();
      resolve({
        id: id,
        owner: data[0],
        payeeFullName: data[1],
        payeeDescription: data[2],
        networkType: data[3],
        payeeGasFee: new BigNumber(data[4]),
      })
    }).then((result) => {
      console.log(result)
      setRequestDetails(result)
      setModal(true)
    })
      .catch((error) => console.error(error));
  }

  const fundPayee = async (_price, _index) => {
    setDisabled(true)
    try {
      const cUSDContract = new kit.web3.eth.Contract(erc20, cUSDContractAddress);
      const cost = new BigNumber(_price).shiftedBy(ERC20_DECIMALS).toString();

      const result = await cUSDContract.methods
        .approve(contractAddress, cost)
        .send({ from: address });

      await contract.methods.fundPayee(_index).send({ from: address });
      alert('Transfer successful')
      setDisabled(false)
      getBalance();

    } catch (error) {
      console.log({ error });
    }
  };

  const chat = async (id) => {
    setDisableChaButton(true)
    try {
      await contract.methods
        .storeChatMessages(
          id, message
        )
        .send({ from: address });
      alert('sent')
      getChatsById(id)
      setDisableChaButton(false)
      setMessage('')

    } catch (error) {
      console.log(error);
      alert('Error')
      setDisableChaButton(false)
    }
  }

  const getChatsById = async function (id) {
    setLoadChats(true)
    try {
      let data = await contract.methods.getChatsById(id).call();
      setChats(data)
      setLoadChats(false)
      setViewChats(true)
    }
    catch (error) {
      alert('failed to fetch data')
      setLoadChats(false)
    }
  }
  return (
    <>
      <Container>

        <div className="row">
          <center>
            <h3 className="my-5">Requests</h3>
          </center>
          {loading ?
            <center>
              <p style={{ fontSize: '12px' }}>Loading requests please wait...</p>
            </center>
            :
            requests.map(request =>
              <div className="card shadow col-lg-4 col-md-4 col-sm-12 ml-3 mr-1 mb-3 p-0">
                <div className="card-body p-2">
                  <div className='d-flex'>
                    <div>
                      <Blockies
                        seed={request.owner}
                        size={10}
                        scale={3}
                        className="identicon rounded-circle"
                      />
                    </div>


                    <div className='mx-3'>
                      <h6>{request.payeeFullName}</h6>
                      <p style={{ margin: 0, padding: 0, fontSize: '12px' }}>
                        {/* Price:${request.payeeGasFee / 10 ** 18} */}
                        Network Type: {request.networkType}
                      </p>

                    </div>
                    <Button size='sm' color='success' className='p-1 flex-end'
                      onClick={() => getRequests(request.index)}>View</Button>
                  </div>

                </div>
              </div>)}
        </div>
      </Container>

      <Modal isOpen={modal} toggle={toggle} className={className} backdrop={'static'}>
        <ModalHeader toggle={toggle} close={closeBtn}>
          Details:
        </ModalHeader>
        <ModalBody>
          <div className="card">
            <div className="card-body">
              <div className='d-flex'>
                <div>
                  <Blockies
                    seed={requestDetails.owner}
                    size={10}
                    scale={3}
                    className="identicon rounded-circle"
                  />
                </div>


                <div className='mx-3'>
                  <h6 className="title">{requestDetails.payeeFullName}</h6>
                  <p style={{ fontWeight: 'bold' }} className='p-0 m-0'>Description:</p>
                  <p style={{ fontSize: '15px' }} className='p-0 m-0'>{requestDetails.payeeDescription}</p>
                  <p style={{ fontWeight: 'bold' }} className='p-0 m-0'>
                    Amount:
                  </p>
                  <p style={{ fontSize: '15px' }} className='p-0 m-0'>{requestDetails.payeeGasFee / 10 ** 18} Celo</p>

                  <p style={{ fontWeight: 'bold' }} className='p-0 m-0'>Network Type:</p>
                  <p style={{ fontSize: '15px' }} className='p-0 m-0'>{requestDetails.networkType}</p>

                  <p style={{ fontWeight: 'bold' }} className='p-0 m-0'>Wallet Address:</p>
                  <p style={{ fontSize: '15px' }} className='p-0 m-0'>{requestDetails.owner}</p>

                  <br />
                  <Button size='sm' color='success' disabled={disabled}
                    onClick={() => fundPayee(requestDetails.payeeGasFee / 10 ** 18, requestDetails.id)}
                  >

                    {!disabled ?
                      <span>Transfer </span> :
                      <>
                        <Spinner size="sm">
                          Loading...
                        </Spinner>
                        <span>
                          {' '}Transfering
                        </span>
                      </>
                    }
                  </Button>

                  <Button size='sm' className='mx-2' color='primary' disabled={disabled}
                    onClick={() => getChatsById(requestDetails.id)}
                  >

                    {!loadChats ?
                      <span>Chat </span> :
                      <>
                        <Spinner size="sm">
                          Loading...
                        </Spinner>
                        <span>
                          {' '}Loading
                        </span>
                      </>
                    }

                  </Button>
                </div>
              </div>
            </div>
          </div>

          {viewChats &&
            <div className="card">
              <div className="card-body">
                <div className='d-flex align-items-center'>
                  <Input type='text' placeholder='Type your message'
                    value={message} onChange={(e) => setMessage(e.target.value)}
                  />
                  <Button size='sm' disabled={disableChatButton} className='bg-success'
                    onClick={() => chat(requestDetails.id)}>

                    {!disableChatButton ?
                      <span>Send </span> :
                      <>
                        <Spinner size="sm">
                          Loading...
                        </Spinner>

                      </>
                    }
                  </Button>
                </div>

                {chats && chats.map((itm, idx) => (
                  <div className='bg-info rounded mt-2 p-1 text-white d-flex'>
                   
                     
                      <Blockies
                        seed= {itm[0]}
                        size={10}
                        scale={3}
                        className="identicon rounded-circle"
                        
                      />
                      

                    <p style={{ fontSize: '12px', fontWeight : "bold" }} className='m-0 p-0 mx-2'>{itm[1]}</p>
                  </div>
                )
                )}
              </div>
            </div>
          }

        </ModalBody>
      </Modal>
    </>
  )
}

export default Index;