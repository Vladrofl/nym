import React, { useContext, useEffect } from 'react'
import Typography from '@material-ui/core/Typography'
import { Grid, LinearProgress, Paper } from '@material-ui/core'
import { Gateway, MixNode } from '@nymproject/nym-validator-client/dist/types'
import Confirmation from '../Confirmation'
import { ValidatorClientContext } from '../../contexts/ValidatorClient'
import NoClientError from '../NoClientError'
import { useRouter } from 'next/router'
import BondNodeForm from './BondNodeForm'
import { NodeType } from '../../common/node'
import Link from '../Link'
import { theme } from '../../lib/theme'
import { checkNodesOwnership, makeBasicStyle } from '../../common/helpers'
import NodeTypeChooser from '../NodeTypeChooser'
import ExecFeeNotice from '../ExecFeeNotice'
import { printableBalanceToNative } from '@nymproject/nym-validator-client/dist/currency'
import { coin } from '@nymproject/nym-validator-client'
import { UDENOM } from '../../pages/_app'

export type BondingInformation = {
  amount: string
  nodeDetails: MixNode | Gateway
}

const BondNode = () => {
  const classes = makeBasicStyle(theme)
  const router = useRouter()
  const { client } = useContext(ValidatorClientContext)

  const [bondingStarted, setBondingStarted] = React.useState(false)
  const [bondingFinished, setBondingFinished] = React.useState(false)
  const [bondingError, setBondingError] = React.useState(null)

  const [checkedOwnership, setCheckedOwnership] = React.useState(false)
  const [ownsMixnode, setOwnsMixnode] = React.useState(false)
  const [ownsGateway, setOwnsGateway] = React.useState(false)

  const [minimumMixnodeBond, setMinimumMixnodeBond] = React.useState(null)
  const [minimumGatewayBond, setMinimumGatewayBond] = React.useState(null)

  const [nodeType, setNodeType] = React.useState(NodeType.Mixnode)

  useEffect(() => {
    const getInitialData = async () => {
      if (client === null) {
        await router.push('/')
      } else {
        const nodeOwnership = await checkNodesOwnership(client)
        setOwnsMixnode(nodeOwnership.ownsMixnode)
        setOwnsGateway(nodeOwnership.ownsGateway)

        const minimumMixnodeBond = await client.minimumMixnodeBond()
        setMinimumMixnodeBond(minimumMixnodeBond)
        const minimumGatewayBond = await client.minimumGatewayBond()
        setMinimumGatewayBond(minimumGatewayBond)

        setCheckedOwnership(true)
      }
    }
    getInitialData()
  }, [client])

  const bondNode = async (bondingInformation: BondingInformation) => {
    setBondingStarted(true)
    console.log(`BOND button pressed`)

    console.log(bondingInformation)
    let amountValue = parseInt(
      printableBalanceToNative(bondingInformation.amount)
    )
    let amount = coin(amountValue, UDENOM)

    console.log(bondingInformation.nodeDetails)

    if (nodeType == NodeType.Mixnode) {
      let mixnode = bondingInformation.nodeDetails as MixNode
      client
        .bondMixnode(mixnode, amount)
        .then((value) => {
          console.log('bonded mixnode!', value)
        })
        .catch(setBondingError)
        .finally(() => setBondingFinished(true))
    } else {
      let gateway = bondingInformation.nodeDetails as Gateway
      client
        .bondGateway(gateway, amount)
        .then((value) => {
          console.log('bonded gateway!', value)
        })
        .catch(setBondingError)
        .finally(() => setBondingFinished(true))
    }
  }

  const getBondContent = () => {
    // we're not signed in
    if (client === null) {
      return <NoClientError />
    }

    // we haven't checked whether we actually already own a node
    if (!checkedOwnership) {
      return <LinearProgress />
    }

    // we already own a mixnode
    if (ownsMixnode) {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography gutterBottom>
              You have already have a bonded mixnode. If you wish to bond a
              different one, you need to first{' '}
              <Link href='/unbond'>unbond the existing one</Link>.
            </Typography>
          </Grid>
        </Grid>
      )
    }

    // we already own a gateway
    if (ownsGateway) {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography gutterBottom>
              You have already have a bonded gateway. If you wish to bond a
              different one, you need to first{' '}
              <Link href='/unbond'>unbond the existing one</Link>.
            </Typography>
          </Grid>
        </Grid>
      )
    }

    // we haven't clicked bond button yet
    if (!bondingStarted) {
      return (
        <>
          <NodeTypeChooser nodeType={nodeType} setNodeType={setNodeType} />
          <BondNodeForm
            onSubmit={bondNode}
            type={nodeType}
            minimumGatewayBond={minimumGatewayBond}
            minimumMixnodeBond={minimumMixnodeBond}
          />
        </>
      )
    }

    // We started bonding
    return (
      <Confirmation
        isLoading={bondingFinished}
        error={bondingError}
        progressMessage={`${nodeType} bonding is in progress...`}
        successMessage={`${nodeType} bonding was successful!`}
        failureMessage={`Failed to bond the ${nodeType}!`}
      />
    )
  }

  return (
    <>
      <main className={classes.layout}>
        <Paper className={classes.paper}>
          <ExecFeeNotice name='bonding' />
          <Typography
            component='h1'
            variant='h4'
            align='center'
            className={classes.wrapper}
          >
            Bond a {nodeType}
          </Typography>
          {getBondContent()}
        </Paper>
      </main>
    </>
  )
}

export default BondNode
