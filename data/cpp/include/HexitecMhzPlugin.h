/*
 * HexitecMhzPlugin.h
 *
 *  Created on: 12 September 2024
 *      Author: Dominic Banks, STFC Detector Systems Software Group
 */


#ifndef INCLUDE_HEXITECMHZPLUGIN_H_
#define INCLUDE_HEXITECMHZPLUGIN_H_

#include <string>
#include <memory>
#include <log4cxx/logger.h>
#include <log4cxx/basicconfigurator.h>
#include <log4cxx/propertyconfigurator.h>
#include <log4cxx/helpers/exception.h>
using namespace log4cxx;
using namespace log4cxx::helpers;

#include <DpdkFrameProcessorPlugin.h>
#include "HexitecMhzUniversalDecoder.h"
#include "ClassLoader.h"


  /** Detector Plugin
   *
   * The HexitecMhzPlugin class implements a DPDK-aware plugin capable of receiving data
   * frame packets from upstream DPDK packet processing cores and injecting them into the
   * frameProcessor frame data flow.
   */
  
namespace FrameProcessor
{
    class HexitecMhzPlugin : public DpdkFrameProcessorPlugin
    {
    public:
        HexitecMhzPlugin();
        virtual ~HexitecMhzPlugin();
        
        void configure(OdinData::IpcMessage& config, OdinData::IpcMessage& reply);
        void requestConfiguration(OdinData::IpcMessage& reply);
        void status(OdinData::IpcMessage& status);
        bool reset_statistics(void);
        void process_frame(boost::shared_ptr<Frame> frame);
        
    private:
        LoggerPtr logger_;
        HexitecMhzMode current_mode_;                           //!< Current decoder mode
        std::unique_ptr<HexitecMhzUniversalDecoder> decoder_;   //!< Decoder instance
        bool decoder_initialized_;                               //!< Flag to track if decoder has been created
        FrameCallback frame_callback_;
        // Configuration storage
        std::unique_ptr<OdinData::IpcMessage> cached_config_;
    };
    
    REGISTER(FrameProcessorPlugin, HexitecMhzPlugin, "HexitecMhzPlugin");
    
} /* namespace FrameProcessor */

#endif /* INCLUDE_HEXITECMHZPLUGIN_H_ */