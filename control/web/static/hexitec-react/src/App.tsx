import 'bootstrap/dist/css/bootstrap.min.css';

import { OdinApp, TitleCard } from 'odin-react'

function App() {

  return (
    <OdinApp title={'Test'} navLinks={['Test']}>
      <TitleCard title='Test'>
      </TitleCard>
    </OdinApp>
  )
}

export default App